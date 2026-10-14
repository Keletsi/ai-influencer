import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_ORIGIN = 'https://openrouter.ai';
const OPENROUTER_API_PREFIX = '/api/v1';

/** Value shipped in .env.example - never a working key. */
const PLACEHOLDER_KEYS = [
  'your_openrouter_api_key_here',
  'your_api_key',
  'sk-or-v1-',
];

/**
 * Read and validate the API key.
 *
 * A key that is set but blank, whitespace-padded, quoted, or still the
 * placeholder must fail here. Forwarding `Bearer ` produces OpenRouter's
 * opaque "Missing Authentication header", which is far harder to diagnose.
 */
function getApiKey(): string | null {
  const raw = process.env.OPENROUTER_API_KEY;
  if (typeof raw !== 'string') return null;

  // Undo accidental quoting and stray whitespace from .env editing
  const key = raw.trim().replace(/^["']|["']$/g, '').trim();

  if (!key) return null;
  if (PLACEHOLDER_KEYS.includes(key)) return null;

  return key;
}

function missingKeyMessage(): string {
  return (
    'OPENROUTER_API_KEY is missing or invalid. Set it in your .env file ' +
    '(no quotes, no surrounding spaces) and restart the server. Get a key ' +
    'from https://openrouter.ai/keys'
  );
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey = getApiKey();
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Optional attribution headers (recommended by OpenRouter)
  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_APP_NAME) {
    headers['X-Title'] = process.env.OPENROUTER_APP_NAME;
  }

  return headers;
}

function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

/**
 * Resolve the upstream path from the catch-all route params.
 * api/openrouter?path=videos            -> POST /api/v1/videos
 * api/openrouter?path=videos/models     -> GET  /api/v1/videos/models
 * api/openrouter?path=videos/abc123     -> GET  /api/v1/videos/abc123
 * api/openrouter?path=videos/abc/content -> GET /api/v1/videos/abc/content
 */
function resolveApiPath(pathParam: string | string[] | undefined): string {
  const raw = Array.isArray(pathParam) ? pathParam.join('/') : pathParam || '';
  const trimmed = raw.replace(/^\/+|\/+$/g, '');
  return trimmed ? `${OPENROUTER_API_PREFIX}/${trimmed}` : OPENROUTER_API_PREFIX;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({
        error: 'API credentials not configured',
        message: missingKeyMessage(),
      });
    }

    const upstreamPath = resolveApiPath(req.query.path as string | string[] | undefined);

    console.log(`[OpenRouter Proxy] ${req.method} ${upstreamPath}`);

    // Forward the remaining query params (e.g. index=0 on content downloads).
    const forward = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'path') continue;
      if (Array.isArray(value)) {
        for (const entry of value) forward.append(key, entry);
      } else if (typeof value === 'string') {
        forward.append(key, value);
      }
    }
    const queryString = forward.toString();
    const upstreamUrl = `${OPENROUTER_ORIGIN}${upstreamPath}${
      queryString ? `?${queryString}` : ''
    }`;

    const headers = buildHeaders();
    let body: string | undefined;

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(upstreamUrl, {
      method: req.method as string,
      headers,
      body,
    });

    const contentType = response.headers.get('content-type') || '';

    // Video content endpoint streams binary - pass it straight through so the
    // browser can play it without buffering the whole clip as JSON.
    if (contentType.startsWith('video/') || contentType.startsWith('audio/')) {
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: 'Upstream error',
          message: errorText.substring(0, 500),
        });
      }

      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      return res.status(200).send(Buffer.from(buffer));
    }

    const responseText = await response.text();
    let data: unknown;

    if (contentType.includes('application/json') || responseText.trim().startsWith('{')) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: 'Invalid JSON response', raw: responseText.substring(0, 200) };
      }
    } else {
      data = { error: 'Non-JSON response from API', raw: responseText.substring(0, 200) };
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[OpenRouter Proxy] Error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}