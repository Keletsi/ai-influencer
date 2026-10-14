// OpenRouter Video Generation API types

export type OpenRouterJobStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface OpenRouterImageReference {
  type: 'image_url';
  image_url: { url: string };
}

export interface OpenRouterVideoReference {
  type: 'video_url';
  video_url: { url: string };
}

export interface OpenRouterAudioReference {
  type: 'audio_url';
  audio_url: { url: string };
}

export type OpenRouterInputReference =
  | OpenRouterImageReference
  | OpenRouterVideoReference
  | OpenRouterAudioReference;

export interface OpenRouterFrameImage {
  type: 'image_url';
  image_url: { url: string };
  frame_type: 'first_frame' | 'last_frame';
}

/**
 * A single video generation model as returned by GET /api/v1/videos/models
 */
export interface OpenRouterVideoModel {
  id: string;
  canonical_slug?: string;
  name: string;
  description?: string;
  created?: number;
  supported_resolutions?: string[] | null;
  supported_aspect_ratios?: string[] | null;
  supported_sizes?: string[] | null;
  supported_durations?: number[] | null;
  supported_frame_images?: string[] | null;
  generate_audio?: boolean | null;
  seed?: boolean | null;
  pricing_skus?: Record<string, string> | null;
  allowed_passthrough_parameters?: string[] | null;
}

export interface OpenRouterVideoModelsResponse {
  data: OpenRouterVideoModel[];
}

/**
 * Request body for POST /api/v1/videos
 */
export interface OpenRouterVideoCreateRequest {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  frame_images?: OpenRouterFrameImage[];
  input_references?: OpenRouterInputReference[];
  generate_audio?: boolean;
  seed?: number;
  callback_url?: string;
  provider?: Record<string, unknown>;
}

/**
 * Response from POST /api/v1/videos and GET /api/v1/videos/{id}
 */
export interface OpenRouterVideoJob {
  id: string;
  polling_url?: string;
  status: OpenRouterJobStatus;
  generation_id?: string | null;
  model?: string | null;
  error?: string | null;
  unsigned_urls?: string[];
  usage?: {
    cost?: number;
    is_byok?: boolean;
  };
}