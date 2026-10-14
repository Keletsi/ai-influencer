import type {
  OpenRouterVideoJob,
  OpenRouterVideoModel,
  OpenRouterVideoModelsResponse,
  OpenRouterVideoCreateRequest,
  OpenRouterInputReference,
} from '@/types/openrouter';
import type { ProgressCallback, UnifiedTaskResult } from '@/types/motion';
import { extractVideoFrames } from './local-storage';

const API_BASE_URL =
  import.meta.env.VITE_OPENROUTER_API_BASE_URL || '/api/openrouter';

const POLL_INTERVAL_MS = 5000;

/** Consecutive polling failures tolerated before surfacing an error. */
const MAX_CONSECUTIVE_FAILURES = 5;

/** Attempts to pull the finished video before giving up. */
const DOWNLOAD_ATTEMPTS = 3;

/** localStorage key for the most recent submitted job (download recovery). */
const LAST_JOB_KEY = 'motion-studio-last-job';

export interface SavedJob {
  taskId: string;
  model: string;
  submittedAt: number;
}

/**
 * Convert an OpenRouter `unsigned_urls` entry into a proxy path.
 *
 * The entries are absolute content URLs like
 * `https://openrouter.ai/api/v1/videos/<id>/content?index=0`. The proxy
 * already prepends `/api/v1`, so both the origin AND that prefix must go -
 * leaving them in produces `/api/v1/api/v1/...` and a 404. The query string
 * is preserved and forwarded because it can carry required parameters.
 */
export function unsignedUrlToProxyTarget(unsignedUrl: string): {
  path: string;
  query: string;
} {
  const withoutOrigin = unsignedUrl
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+/, '');
  const withoutPrefix = withoutOrigin.replace(/^api\/v1\//i, '');
  const separator = withoutPrefix.indexOf('?');

  if (separator === -1) {
    return { path: withoutPrefix, query: '' };
  }

  return {
    path: withoutPrefix.substring(0, separator),
    query: withoutPrefix.substring(separator + 1),
  };
}

/** Remember the latest submitted job so a finished render can be recovered. */
export function saveLastJob(taskId: string, model: string): void {
  try {
    localStorage.setItem(
      LAST_JOB_KEY,
      JSON.stringify({ taskId, model, submittedAt: Date.now() } satisfies SavedJob)
    );
  } catch {
    // Non-fatal; recovery just won't be offered
  }
}

export function loadLastJob(): SavedJob | null {
  try {
    const raw = localStorage.getItem(LAST_JOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedJob;
    return parsed?.taskId ? parsed : null;
  } catch {
    return null;
  }
}

export function clearLastJob(): void {
  try {
    localStorage.removeItem(LAST_JOB_KEY);
  } catch {
    // Non-fatal
  }
}

/** Default clip length in seconds. Seedance 2.x supports 4-15. */
export const DEFAULT_DURATION_SECONDS = 10;

/** Key frames sampled for the no-public-URL fallback. */
const FRAME_SAMPLE_COUNT = 8;

/**
 * Maximum `input_references` items (avatar + frames) per model family.
 * Wan 2.7 rejects more than 5 with "Media array is too long"; Seedance
 * accepts up to 50. Unknown models get the conservative default.
 */
const MODEL_REFERENCE_LIMITS: Array<{ match: RegExp; maxTotal: number }> = [
  { match: /alibaba\/wan-2\.7/, maxTotal: 5 },
];

const DEFAULT_MAX_REFERENCES = 9; // 1 avatar + 8 frames

function maxReferencesFor(modelId: string): number {
  const hit = MODEL_REFERENCE_LIMITS.find((entry) => entry.match.test(modelId));
  return hit ? hit.maxTotal : DEFAULT_MAX_REFERENCES;
}

/**
 * How the driver's motion reached the model.
 *
 * - `video-reference`  the model reads real motion from the clip
 * - `frame-reference`  motion is approximated from sampled key frames
 */
export type TransferMode = 'video-reference' | 'frame-reference';

/**
 * Turn an upstream failure into an actionable message. OpenRouter rejects a
 * job when the references are unusable (too large, wrong format, unreachable),
 * and those come back as opaque 400s otherwise.
 */
function toActionableError(error: unknown, fallback: string): Error {
  const original = error instanceof Error ? error : new Error(String(error));
  const message = original.message;

  if (/too large|exceeds|413|size limit|maximum size/i.test(message)) {
    return new Error(
      'Your files are too large for the API. Use an avatar image under 10MB and a driver video under 20MB.'
    );
  }

  if (/duration|unsupported.*length/i.test(message)) {
    return new Error(
      `The requested clip length was rejected. ${message}`
    );
  }

  if (/aspect|resolution|unsupported/i.test(message)) {
    return new Error(`Those settings were rejected by the model. ${message}`);
  }

  if (/rate limit|429|too many requests/i.test(message)) {
    return new Error('OpenRouter rate limited this request. Try again in a moment.');
  }

  if (
    /missing authentication header|no cookie auth|credentials not configured|401|unauthorized|invalid.*key|credit/i.test(
      message
    )
  ) {
    return new Error(
      'OpenRouter did not accept the API key. Check that OPENROUTER_API_KEY is set in .env (no quotes, no spaces) and restart the server. Get a key from https://openrouter.ai/keys'
    );
  }

  if (/content|policy|moderation|sensitive|privacy/i.test(message)) {
    return new Error(
      'The provider refused this content - usually its real-person filter ' +
        'flagging a recognizable face in the avatar or driver footage. ' +
        `Upstream said: ${message}`
    );
  }

  if (/fetch failed|network|failed to fetch|load failed/i.test(message)) {
    return new Error(
      'Could not reach the app server. Make sure it is running with "npm run dev", then reload the page.'
    );
  }

  return new Error(message || fallback);
}

/** Local safety limits (also enforced before upload by the UI). */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

/**
 * Motion transfer is pinned to Seedance 2.x on purpose.
 *
 * OpenRouter only honors *video* input references on the BytePlus Seedance 2
 * generation and newer; every other provider silently drops them and falls
 * back to image-only guidance. Since the whole point of this task is to read
 * motion out of the driver video, a cheaper or faster model would ignore the
 * motion source entirely.
 */
export const MOTION_TRANSFER_MODEL = 'bytedance/seedance-2.0';

export const MOTION_TRANSFER_FALLBACKS = [
  'bytedance/seedance-2.5',
  'bytedance/seedance-2.0-mini',
];

/**
 * Models tried when the primary refuses the content on provider policy
 * (e.g. Seedance's real-person filter). Only used in frame-reference mode,
 * where no `video_url` is sent - so the Seedance-only video-reference
 * requirement does not apply and other vendors are valid targets.
 *
 * Wan 2.7 documents multi-image reference-to-video; Hailuo 3 bills per
 * reference image, which implies the same support.
 */
export const POLICY_BLOCK_RETRY_MODELS = [
  'alibaba/wan-2.7',
  'minimax/hailuo-3',
];

/**
 * True when the failure is a provider content policy (real-person filter,
 * sensitive content) rather than a malformed request. Retrying the identical
 * payload on the same model will always fail; a different vendor may not
 * share the policy.
 */
export function isPolicyBlock(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /sensitive|privacy|real person|content.*policy|policy.*content|moderation/i.test(
    message
  );
}

export const MOTION_TRANSFER_LABEL = 'Seedance 2.0';

function toTaskStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'failed';
    case 'in_progress':
      return 'processing';
    default:
      return 'pending';
  }
}

function statusToProgress(status: 'pending' | 'processing' | 'completed' | 'failed'): number {
  if (status === 'completed' || status === 'failed') return 100;
  if (status === 'processing') return 50;
  return 10;
}

/** Pick the supported duration closest to the requested one. */
function clampDuration(desired: number, supported?: number[] | null): number {
  if (!supported || supported.length === 0) return Math.max(1, Math.round(desired));
  if (supported.includes(desired)) return desired;

  return [...supported].sort((a, b) => a - b).reduce((best, candidate) =>
    Math.abs(candidate - desired) < Math.abs(best - desired) ? candidate : best
  );
}

function firstSupported(
  desired: string,
  supported: string[] | null | undefined,
  fallback: string
): string {
  if (!supported || supported.length === 0) return desired;
  return supported.includes(desired) ? desired : supported[0] || fallback;
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read file as a data URL'));
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export interface MotionTransferRequest {
  /** Avatar still: the identity that receives the motion. */
  imageFile: File;
  /** Driver video: the motion source. */
  videoFile: File;
  motionStrength?: number;
  matchMode?: 'structure' | 'motion';
  duration?: number;
  negativePrompt?: string;
  quality?: '720p' | '1080p';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Free-form user instruction. Honoured verbatim. */
  prompt?: string;
}

/**
 * Prompt that transfers motion from the driver video onto the avatar image.
 *
 * The user's own instruction always leads the prompt so their words drive the
 * result; the motion-transfer rules are appended as grounding rather than
 * replacing what they asked for.
 *
 * Reference indices are 1-based and match the order of the `input_references`
 * array: image 1 is always the avatar. How the motion arrives changes the
 * wording:
 *  - `video-reference`: video 1 is the driver clip
 *  - `frame-reference`: images 2..N are sampled frames of that clip
 */
export function buildMotionTransferPrompt(
  request: MotionTransferRequest,
  mode: TransferMode = 'video-reference'
): string {
  const {
    matchMode = 'structure',
    motionStrength = 65,
    negativePrompt,
    prompt,
  } = request;

  const frames = mode === 'frame-reference';

  const source = frames
    ? 'the frames in images 2 onwards, which are evenly spaced samples of one motion clip'
    : 'video 1';

  const direction =
    matchMode === 'motion'
      ? `Follow ${source} closely: reproduce the full body motion, travel path and camera movement exactly, keeping every limb faithful to the driver.`
      : `Follow ${source} while preserving image 1 exactly: keep the subject framing, proportions, clothing and background from image 1 unchanged.`;

  const strength =
    motionStrength >= 75
      ? 'Match the driver motion precisely and at high intensity.'
      : motionStrength <= 35
        ? 'Use the driver motion only as a subtle guide, keeping the subject mostly still.'
        : 'Use a balanced amount of the driver motion.';

  const rules = frames
    ? [
        'Animate the subject in image 1 so that they perform the movement shown across the following frames.',
        'The images after image 1 are evenly spaced samples of a single continuous motion clip, in temporal order.',
        `Interpolate smoothly between those poses so the result is continuous natural motion, not a slideshow. Apply that motion, weight shifts and timing to the identity, face, clothing and appearance of the subject in image 1.`,
        direction,
        strength,
        'Keep the camera path, framing and pacing implied by the frames. Single continuous shot, no cuts, photorealistic and temporally consistent.',
      ].join(' ')
    : [
        'Animate the subject in image 1 so that they perform the same movement as the person in video 1.',
        'Transfer the motion, body pose, gestures, weight shifts and timing of video 1 onto the identity, face, clothing and appearance of the subject in image 1.',
        direction,
        strength,
        'Keep the camera path, framing and pacing of video 1. Single continuous shot, no cuts, photorealistic and temporally consistent.',
      ].join(' ');

  const parts: string[] = [];

  // Lead with the user's instruction so it is never diluted or overridden.
  if (prompt && prompt.trim()) {
    parts.push(prompt.trim());
    parts.push(rules);
  } else {
    parts.push(rules);
  }

  if (negativePrompt && negativePrompt.trim()) {
    parts.push(`Avoid: ${negativePrompt.trim()}.`);
  }

  return parts.join(' ');
}

export interface OpenRouterHealth {
  /** The proxy answered at all. */
  reachable: boolean;
  /** The proxy reports a usable API key. */
  configured: boolean;
  /**
   * Whether the server can host the driver video at a public HTTPS URL,
   * which is required for a true `video_url` motion reference.
   */
  canHostVideo: boolean;
  /** User-facing explanation when something is wrong. */
  message?: string;
}

/**
 * Verify the proxy and the API key server-side.
 *
 * These are reported separately: a dead proxy and a missing key look
 * identical from a `fetch` rejection, and telling someone to fix their API
 * key when the server simply is not running sends them the wrong way.
 */
async function checkHealth(): Promise<OpenRouterHealth> {
  let health: { configured?: boolean; canHostVideo?: boolean } | null = null;

  try {
    const response = await fetch('/api/health', { method: 'GET' });
    if (response.ok) {
      health = await response.json();
    }
  } catch {
    return {
      reachable: false,
      configured: false,
      canHostVideo: false,
      message:
        'Could not reach the app server. Restart it with "npm run dev" and reload the page.',
    };
  }

  const configured = !!health?.configured;

  return {
    reachable: true,
    configured,
    canHostVideo: !!health?.canHostVideo,
    message: configured
      ? undefined
      : 'OPENROUTER_API_KEY is missing or invalid. Set it in your .env file as a bare value (no quotes or spaces) and restart.',
  };
}

class OpenRouterApiService {
  private modelCache: OpenRouterVideoModel[] | null = null;
  private modelCacheExpiry = 0;
  private healthCache: { value: boolean; expiry: number } | null = null;

  private proxyUrl(path: string): string {
    return `${API_BASE_URL.replace(/\/+$/, '')}?path=${path}`;
  }

  /**
   * fetch() only rejects with TypeError ("Failed to fetch") when the request
   * never reached the server at all: dead process, wrong port, or the page
   * loaded from somewhere the proxy isn't. That is a different failure from
   * an HTTP error, so translate it into instructions.
   */
  private async fetchProxy(path: string, init?: RequestInit): Promise<Response> {
    return this.fetchProxyUrl(this.proxyUrl(path), init);
  }

  private async fetchProxyUrl(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Could not reach the app server at ${url} (${detail}). ` +
          `Start it with "npm run dev" and open http://localhost:8080/`
      );
    }
  }

  /**
   * True when the server reports a working API key.
   *
   * Use `getHealth()` when you need to tell "server down" apart from
   * "key missing" - this collapses both to false.
   */
  async isConfigured(force = false): Promise<boolean> {
    if (!force && this.healthCache && this.healthCache.expiry > Date.now()) {
      return this.healthCache.value;
    }

    const health = await checkHealth();

    this.healthCache = { value: health.configured, expiry: Date.now() + 60_000 };
    return health.configured;
  }

  /** Detailed health check that distinguishes reachability from credentials. */
  async getHealth(): Promise<OpenRouterHealth> {
    return checkHealth();
  }

  /** Cached list of available video models and their capabilities. */
  async listModels(force = false): Promise<OpenRouterVideoModel[]> {
    if (!force && this.modelCache && this.modelCacheExpiry > Date.now()) {
      return this.modelCache;
    }

    const response = await this.fetchProxy('videos/models', { method: 'GET' });
    const data = await this.parse<OpenRouterVideoModelsResponse>(response);
    const models = Array.isArray(data?.data) ? data.data : [];

    console.log(`[OpenRouter] Loaded ${models.length} video models from ${API_BASE_URL}`);

    this.modelCache = models;
    this.modelCacheExpiry = Date.now() + 5 * 60_000;
    return models;
  }

  private async parse<T>(response: Response): Promise<T> {
    const text = await response.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // A 404 here almost always means the proxy lost the upstream path and
      // hit the bare API root, so name the URL that was actually requested.
      const preview = text.slice(0, 200).replace(/\s+/g, ' ').trim();
      throw new Error(
        `OpenRouter proxy returned a non-JSON response (${response.status}) for ${response.url}` +
          (preview ? ` — ${preview}` : '')
      );
    }

    const payload = data as
      | { error?: { message?: string } | string; message?: string }
      | null;

    if (!response.ok || payload?.error) {
      const errorField = payload?.error;
      const message =
        (typeof errorField === 'object' ? errorField?.message : errorField) ||
        payload?.message ||
        `OpenRouter request failed (${response.status})`;
      throw new Error(message);
    }

    return data as T;
  }

  /** Look up the model record so we only send parameters it supports. */
  async getModel(modelId: string): Promise<OpenRouterVideoModel | undefined> {
    try {
      const models = await this.listModels();
      return models.find((m) => m.id === modelId);
    } catch (error) {
      console.warn('[OpenRouter] Could not load model list:', error);
      return undefined;
    }
  }

  /** Resolve the motion-transfer model, honoring the user's duration/resolution. */
  async resolveModel(constraints?: {
    duration?: number;
    resolution?: string;
  }): Promise<string> {
    let models: OpenRouterVideoModel[] = [];
    try {
      models = await this.listModels();
    } catch {
      return MOTION_TRANSFER_MODEL;
    }

    for (const candidate of [MOTION_TRANSFER_MODEL, ...MOTION_TRANSFER_FALLBACKS]) {
      const model = models.find((m) => m.id === candidate);
      if (!model) continue;

      const durations = model.supported_durations;
      if (constraints?.duration && durations?.length && !durations.includes(constraints.duration)) {
        continue;
      }

      const resolutions = model.supported_resolutions;
      if (
        constraints?.resolution &&
        resolutions?.length &&
        !resolutions.includes(constraints.resolution)
      ) {
        continue;
      }

      return model.id;
    }

    return MOTION_TRANSFER_MODEL;
  }

  /**
   * Translate app settings into request parameters, silently adjusting only
   * what the chosen model cannot do.
   *
   * Sending a parameter the model rejects fails the whole job with a 400, so
   * anything unsupported is dropped or clamped rather than pushed upstream.
   * Values that survive are exactly what the user asked for.
   */
  private async buildParameters(
    model: OpenRouterVideoModel | undefined,
    request: MotionTransferRequest
  ): Promise<Partial<OpenRouterVideoCreateRequest>> {
    const params: Partial<OpenRouterVideoCreateRequest> = {};

    const desiredDuration =
      request.duration && request.duration > 0
        ? request.duration
        : DEFAULT_DURATION_SECONDS;
    if (model?.supported_durations?.length) {
      params.duration = clampDuration(
        Math.min(30, Math.max(1, desiredDuration)),
        model.supported_durations
      );
    }

    if (model?.supported_resolutions?.length) {
      params.resolution = firstSupported(
        request.quality === '1080p' ? '1080p' : '720p',
        model.supported_resolutions,
        '720p'
      );
    }

    if (model?.supported_aspect_ratios?.length) {
      params.aspect_ratio = firstSupported(
        request.aspectRatio || '16:9',
        model.supported_aspect_ratios,
        '16:9'
      );
    }

    // Only ask for audio when the model actually produces it
    if (model?.generate_audio) {
      params.generate_audio = false;
    }

    return params;
  }

  /**
   * Submit a motion transfer job.
   *
   * OpenRouter requires `video_url.url` to be a public HTTPS URL: it rejects
   * base64 data URLs for video (images accept them), and the Files API does
   * not accept MP4 either. So there are two paths:
   *
   *  1. True motion transfer - upload the clip to our own server and reference
   *     it by HTTPS URL. Used whenever the server reports a public origin.
   *  2. Frame fallback - sample the clip into key frames and send those as
   *     image references. Works with no infrastructure, but the model
   *     approximates the motion from a storyboard instead of reading it.
   */
  async createMotionTransfer(
    request: MotionTransferRequest,
    opts?: { frameBudget?: number }
  ): Promise<{
    taskId: string;
    model: string;
    transferMode: TransferMode;
    /** Total input_references attached (avatar + frames). */
    referenceCount: number;
  }> {
    if (request.imageFile.size > MAX_IMAGE_BYTES) {
      throw new Error('Reference image must be 10MB or smaller');
    }
    if (request.videoFile.size > MAX_VIDEO_BYTES) {
      throw new Error('Motion video must be 20MB or smaller');
    }

    const resolution = request.quality === '1080p' ? '1080p' : '720p';
    const modelId = await this.resolveModel({
      duration: request.duration,
      resolution,
    });

    // In frame mode there is no video reference, so when the primary vendor
    // blocks the content on policy (real-person filter), other vendors are
    // legitimate alternates. In video mode only Seedance honors the clip,
    // so retrying elsewhere would silently drop the motion source.
    //
    // The first attempt is built optimistically; each candidate then gets a
    // reference set sized to its own media limit (Wan 2.7 allows 5 items).
    const firstReferences = await this.buildReferences(
      request,
      modelId,
      opts?.frameBudget
    );
    const candidates =
      firstReferences.mode === 'frame-reference'
        ? [modelId, ...POLICY_BLOCK_RETRY_MODELS.filter((m) => m !== modelId)]
        : [modelId];

    let lastError: unknown = null;

    for (const candidate of candidates) {
      const candidateModel = await this.getModel(candidate);
      const references =
        candidate === modelId
          ? firstReferences
          : await this.buildReferences(request, candidate, opts?.frameBudget);

      const body: OpenRouterVideoCreateRequest = {
        model: candidate,
        prompt: buildMotionTransferPrompt(request, references.mode),
        input_references: references.inputs,
      };

      // Spread last so capability clamping can never drop the references or
      // overwrite the prompt the user wrote.
      Object.assign(body, await this.buildParameters(candidateModel, request));

      console.log('[OpenRouter] Submitting motion transfer:', {
        model: body.model,
        mode: references.mode,
        references: references.inputs.length,
        duration: body.duration,
        resolution: body.resolution,
        aspect_ratio: body.aspect_ratio,
      });

      try {
        const response = await this.fetchProxy('videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const job = await this.parse<OpenRouterVideoJob>(response);
        if (!job.id) throw new Error('OpenRouter did not return a job id');

        if (candidate !== modelId) {
          console.log(
            `[OpenRouter] Primary model blocked the content; ${candidate} accepted it`
          );
        }

        return {
          taskId: job.id,
          model: job.model || candidate,
          transferMode: references.mode,
          referenceCount: references.inputs.length,
        };
      } catch (error) {
        lastError = error;

        const isLast = candidate === candidates[candidates.length - 1];
        if (!isLast && isPolicyBlock(error)) {
          console.warn(
            `[OpenRouter] ${candidate} blocked the content on policy, trying next vendor`
          );
          continue;
        }

        throw toActionableError(error, 'OpenRouter rejected the generation request');
      }
    }

    throw toActionableError(lastError, 'OpenRouter rejected the generation request');
  }

  /**
   * Build the avatar data URL once; it leads every reference set.
   */
  private async buildAvatarReference(
    request: MotionTransferRequest
  ): Promise<OpenRouterInputReference> {
    return {
      type: 'image_url',
      image_url: { url: await fileToDataUrl(request.imageFile) },
    };
  }

  /**
   * Build frame references sized to the target model's media limit.
   * The avatar always keeps its slot; frames shrink to fit.
   */
  private async buildFrameReferences(
    request: MotionTransferRequest,
    avatar: OpenRouterInputReference,
    modelId: string,
    frameBudget: number = FRAME_SAMPLE_COUNT
  ): Promise<{ mode: TransferMode; inputs: OpenRouterInputReference[] }> {
    const allowed = Math.max(1, maxReferencesFor(modelId) - 1);
    const count = Math.min(frameBudget, allowed);
    const frames = await extractVideoFrames(request.videoFile, count);

    return {
      mode: 'frame-reference',
      inputs: [
        avatar,
        ...frames.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
      ],
    };
  }

  /**
   * Build `input_references` from local files, preferring a real HTTPS video
   * URL and falling back to sampled frames.
   *
   * `frameBudget` caps the sampled frames so models with small media limits
   * (Wan 2.7 allows 5 items total) are never overfed. The avatar always keeps
   * its slot; frames shrink to fit.
   */
  private async buildReferences(
    request: MotionTransferRequest,
    modelId: string,
    frameBudget: number = FRAME_SAMPLE_COUNT
  ): Promise<{
    mode: TransferMode;
    inputs: OpenRouterInputReference[];
  }> {
    // The avatar is always an inline image; data URLs are accepted there.
    const avatar = await this.buildAvatarReference(request);

    const health = await checkHealth();

    if (health.canHostVideo) {
      try {
        const videoUrl = await this.uploadVideo(request.videoFile);
        if (videoUrl) {
          return {
            mode: 'video-reference',
            inputs: [
              avatar,
              { type: 'video_url', video_url: { url: videoUrl } },
            ],
          };
        }
      } catch (error) {
        console.warn('[OpenRouter] Video upload failed, using frames:', error);
      }
    }

    // No public origin (or the upload failed): approximate motion with frames.
    console.log('[OpenRouter] No public video URL - sampling frames instead');
    return this.buildFrameReferences(request, avatar, modelId, frameBudget);
  }

  /** Upload the driver video to our server and return its public HTTPS URL. */
  private async uploadVideo(file: File | Blob): Promise<string | null> {
    let response: Response;
    try {
      response = await fetch('/api/uploads/video', {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'video/mp4' },
        body: file,
      });
    } catch (error) {
      console.warn('[OpenRouter] Video upload unreachable:', error);
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      console.warn('[OpenRouter] Video upload rejected:', text.substring(0, 200));
      return null;
    }

    const data = await response.json();
    return typeof data?.url === 'string' ? data.url : null;
  }

  async getJob(taskId: string): Promise<OpenRouterVideoJob> {
    const response = await this.fetchProxy(`videos/${taskId}`, { method: 'GET' });
    const text = await response.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`OpenRouter returned a non-JSON response (${response.status})`);
    }

    const payload = (data ?? {}) as {
      status?: unknown;
      error?: { message?: string } | string;
      message?: string;
    };

    // A failed job is a terminal answer, not a transport error: it carries
    // `status: "failed"` alongside the `error` detail. Throwing here would
    // make the poll loop retry a dead job instead of reporting it.
    if (typeof payload.status === 'string') {
      return data as OpenRouterVideoJob;
    }

    if (!response.ok) {
      const field = payload.error;
      throw new Error(
        (typeof field === 'object' ? field?.message : field) ||
          payload.message ||
          `OpenRouter request failed (${response.status})`
      );
    }

    return data as OpenRouterVideoJob;
  }

  /**
   * Resolve a playable URL for a completed job.
   *
   * The content endpoint requires the API key, so it cannot be handed to a
   * plain <video src>. The bytes are fetched through the proxy and turned
   * into an object URL.
   *
   * Candidates are tried in order: the unsigned URL first, then the direct
   * content endpoint for the job id as a fallback.
   */
  async resolveVideoUrl(job: OpenRouterVideoJob): Promise<string> {
    if (!job.id) throw new Error('Completed job has no video content');

    const candidates: Array<{ path: string; query: string }> = [];

    const unsigned = job.unsigned_urls?.[0];
    if (unsigned) {
      candidates.push(unsignedUrlToProxyTarget(unsigned));
    }
    candidates.push({ path: `videos/${job.id}/content`, query: '' });

    let lastError: Error | null = null;
    let attempt = 0;

    for (const candidate of candidates) {
      for (let retry = 0; retry < DOWNLOAD_ATTEMPTS; retry++) {
        attempt++;
        try {
          // The extra params (e.g. index=0) ride as their own query keys so
          // the proxy can forward them upstream untouched.
          const target =
            this.proxyUrl(candidate.path) +
            (candidate.query ? `&${candidate.query}` : '');
          const response = await this.fetchProxyUrl(target);
          if (!response.ok) {
            throw new Error(
              `Failed to download generated video (${response.status})`
            );
          }

          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('Generated video was empty');
          }

          return URL.createObjectURL(blob);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(
            `[OpenRouter] Video download attempt ${attempt} failed:`,
            lastError.message
          );
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
        }
      }
    }

    throw lastError || new Error('Failed to download generated video');
  }

  /**
   * Recover a previously submitted job: check its status, and if it
   * completed, download the video. Used when a render finished but the bytes
   * never made it into the session (bad download URL, closed tab, crash).
   */
  async recoverJob(
    taskId: string,
    model: string,
    duration?: number
  ): Promise<UnifiedTaskResult> {
    let job: OpenRouterVideoJob;
    try {
      job = await this.getJob(taskId);
    } catch (error) {
      throw toActionableError(error, 'Could not look up the previous job');
    }

    const status = toTaskStatus(job.status);

    if (status === 'completed') {
      const videoUrl = await this.resolveVideoUrl(job);
      return {
        taskId,
        model: job.model || model,
        status: 'completed',
        progress: 100,
        result: {
          videoUrl,
          duration: duration || DEFAULT_DURATION_SECONDS,
          creditsUsed: job.usage?.cost,
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
    }

    if (status === 'failed') {
      throw toActionableError(
        job.error || 'The previous job failed',
        'The previous job failed'
      );
    }

    const running = new Error(
      `The previous job is still ${job.status}. Let it finish, then recover it.`
    );
    (running as Error & { code?: string }).code = 'JOB_NOT_DONE';
    throw running;
  }

  /** Poll until the job reaches a terminal state, reporting progress. */
  async waitForCompletion(
    taskId: string,
    model: string,
    onProgress?: ProgressCallback,
    duration?: number
  ): Promise<UnifiedTaskResult> {
    // Counts *consecutive* failures, not total polls: a long render that hits
    // one blip at poll 40 must not be abandoned.
    let consecutiveFailures = 0;

    // Both terminal branches return; this only exits via a thrown error.
    for (;;) {
      let job: OpenRouterVideoJob;
      try {
        job = await this.getJob(taskId);
        consecutiveFailures = 0;
      } catch (error) {
        consecutiveFailures++;
        if (consecutiveFailures > MAX_CONSECUTIVE_FAILURES) {
          throw toActionableError(error, 'Lost contact with the OpenRouter API');
        }
        console.warn(
          `[OpenRouter] Poll ${consecutiveFailures} failed, retrying:`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        continue;
      }

      const status = toTaskStatus(job.status);
      await onProgress?.(statusToProgress(status), status, job.usage?.cost);

      if (status === 'completed') {
        // The render is done and billed; a hiccup while fetching the bytes
        // should be retried rather than reported as a failed generation.
        await onProgress?.(90, 'completed', job.usage?.cost);
        const videoUrl = await this.resolveVideoUrl(job);
        return {
          taskId,
          model: job.model || model,
          status: 'completed',
          progress: 100,
          result: {
            videoUrl,
            duration: duration || DEFAULT_DURATION_SECONDS,
            creditsUsed: job.usage?.cost,
          },
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
      }

      if (status === 'failed') {
        const failure = toActionableError(
          job.error || 'Video generation failed',
          'Video generation failed'
        );

        return {
          taskId,
          model: job.model || model,
          status: 'failed',
          progress: 100,
          error: failure.message,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  /**
   * Submit, poll, and return the final result in one call.
   *
   * If the job dies because the reference set was too large for the model,
   * resubmit once with half the frames. Failed jobs are not billed, so the
   * retry is free - and it beats asking the user to change settings for a
   * limit they cannot see.
   */
  async generateMotionTransfer(
    request: MotionTransferRequest,
    onProgress?: ProgressCallback
  ): Promise<UnifiedTaskResult> {
    let frameBudget: number | undefined;
    let lastResult: UnifiedTaskResult | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const started = await this.createMotionTransfer(request, { frameBudget });

      // Remember the job before polling: if the tab closes, crashes, or the
      // download fails after a billed render, the video can still be recovered.
      saveLastJob(started.taskId, started.model);

      await onProgress?.(10, 'pending');

      const result = await this.waitForCompletion(
        started.taskId,
        started.model,
        onProgress,
        request.duration
      );

      result.transferMode = started.transferMode;

      if (result.status === 'completed' || attempt === 2) {
        return result;
      }

      lastResult = result;

      if (!isMediaCountFailure(result.error)) {
        return result;
      }

      // Halve what actually ran (frames, not total): Wan runs 1+4, so the
      // retry runs 1+2 rather than repeating 1+4.
      const usedFrames = Math.max(1, started.referenceCount - 1);
      frameBudget = Math.max(2, Math.floor(usedFrames / 2));
      console.log(
        `[OpenRouter] Job failed on media count (${result.error}); retrying with ${frameBudget} frames`
      );
      await onProgress?.(5, 'pending');
    }

    return (
      lastResult ?? {
        taskId: '',
        model: MOTION_TRANSFER_MODEL,
        status: 'failed' as const,
        progress: 100,
        error: 'Video generation failed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }
    );
  }
}

/** True when a job died because too many references were attached. */
export function isMediaCountFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /media array|too long|maximum of \d+|too many/i.test(message);
}

export const openRouterApi = new OpenRouterApiService();