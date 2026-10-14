/**
 * AI-influencer - single-process server
 *
 * Serves BOTH the frontend and the OpenRouter proxy, so `npm run dev` is the
 * only command you need. Running the app and the proxy separately is the
 * classic cause of "Failed to fetch": the Vite proxy returns an empty 500 when
 * nothing is listening on port 3001.
 *
 *   dev:  npm run dev        -> http://localhost:8080 (Vite middleware + proxy)
 *   prod: npm run build && npm start
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction =
  process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
const PREFERRED_PORT = Number(process.env.PORT) || (isProduction ? 3001 : 8080);
let PORT = PREFERRED_PORT;

/**
 * Loud crash reporting. A dev server that vanishes without a word is the
 * hardest failure to diagnose, so uncaught errors are printed with a banner
 * instead of disappearing into a closed terminal scrollback.
 */
process.on('unhandledRejection', (reason) => {
  console.error('');
  console.error('  !! Unhandled promise rejection - the server may be unstable !!');
  console.error('  ', reason instanceof Error ? reason.stack || reason.message : reason);
  console.error('');
});

process.on('uncaughtException', (error) => {
  console.error('');
  console.error('  !! Uncaught exception - stopping the server !!');
  console.error('  ', error.stack || error.message);
  console.error('');
  process.exit(1);
});

/**
 * Public HTTPS origin used to hand the driver video to OpenRouter.
 *
 * OpenRouter requires `input_references[].video_url.url` to be a real HTTPS
 * URL - base64 data URLs are rejected for video (images accept them, video
 * does not), and the Files API does not accept MP4 either. So true motion
 * transfer needs the clip to be fetchable from the public internet.
 *
 * Set this to a tunnel/deployed origin, e.g. the output of:
 *   cloudflared tunnel --url http://localhost:8080
 */
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');

const UPLOAD_DIR = path.join(__dirname, '.uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const OPENROUTER_ORIGIN = 'https://openrouter.ai';
const OPENROUTER_API_PREFIX = '/api/v1';

/** Values shipped in .env.example - never working keys. */
const PLACEHOLDER_KEYS = [
  'your_openrouter_api_key_here',
  'your_api_key',
  'sk-or-v1-',
];

const MISSING_KEY_MESSAGE =
  'OPENROUTER_API_KEY is missing or invalid. Set it in your .env file as a ' +
  'bare value (no quotes, no spaces) and restart. Get a key from ' +
  'https://openrouter.ai/keys';

/**
 * Read and validate the API key.
 *
 * A key that is set but blank, whitespace-padded, quoted, or still the
 * placeholder is treated as missing. Forwarding `Bearer ` yields OpenRouter's
 * opaque "Missing Authentication header", which is very hard to debug.
 */
function readApiKey() {
  const raw = process.env.OPENROUTER_API_KEY;
  if (typeof raw !== 'string') return null;

  const key = raw.trim().replace(/^["']|["']$/g, '').trim();
  if (!key) return null;
  if (PLACEHOLDER_KEYS.includes(key)) return null;

  return key;
}

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '80mb' }));

/** Liveness + config state, so the UI can explain itself before generating. */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-influencer',
    mode: isProduction ? 'production' : 'development',
    configured: !!readApiKey(),
    // When set, the driver video can be referenced by a real HTTPS URL
    publicUrl: PUBLIC_URL || null,
    canHostVideo: Boolean(PUBLIC_URL),
  });
});

/**
 * Accept a driver video so it can be served over HTTPS.
 * Raw body upload keeps this proxy-only - no third-party storage.
 */
app.post(
  '/api/uploads/video',
  express.raw({ type: ['video/*', 'application/octet-stream'], limit: '60mb' }),
  (req, res) => {
    const buffer = req.body;
    if (!buffer || !buffer.length) {
      return res.status(400).json({ error: 'Empty upload' });
    }

    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const contentType = req.headers['content-type'] || 'video/mp4';
    const ext = contentType.includes('quicktime') ? 'mov' : contentType.includes('webm') ? 'webm' : 'mp4';
    const filename = `${id}.${ext}`;

    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
    console.log(`[Upload] Stored ${filename} (${(buffer.length / 1048576).toFixed(2)}MB)`);

    res.json({
      id,
      size: buffer.length,
      contentType,
      // Without a public origin we can only hand back a relative path, which
      // OpenRouter will refuse. The client falls back to frame references.
      url: PUBLIC_URL ? `${PUBLIC_URL}/api/uploads/video/${id}` : null,
    });
  }
);

/** Serve an uploaded driver video. */
app.get('/api/uploads/video/:id', (req, res) => {
  const { id } = req.params;

  // Reject anything that is not a plain generated id
  if (!/^[a-z0-9-]+$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const match = fs
    .readdirSync(UPLOAD_DIR)
    .find((name) => name.startsWith(`${id}.`));

  if (!match) {
    return res.status(404).json({ error: 'Not found' });
  }

  const file = path.join(UPLOAD_DIR, match);
  const stat = fs.statSync(file);
  const contentType = match.endsWith('.webm')
    ? 'video/webm'
    : match.endsWith('.mov')
      ? 'video/quicktime'
      : 'video/mp4';

  // Range support: some fetchers stream rather than download in full
  const range = req.headers.range;
  if (range) {
    const matchRange = /bytes=(\d*)-(\d*)/.exec(range);
    if (matchRange) {
      const start = matchRange[1] ? parseInt(matchRange[1], 10) : 0;
      const end = matchRange[2] ? parseInt(matchRange[2], 10) : stat.size - 1;

      if (start < stat.size && end < stat.size && start <= end) {
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        res.setHeader('Content-Length', end - start + 1);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', contentType);
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
    }
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  fs.createReadStream(file).pipe(res);
});

/**
 * Proxy /api/openrouter/* to the OpenRouter API.
 * The client passes the upstream path as ?path=<path>.
 */
app.use('/api/openrouter', async (req, res) => {
  const apiKey = readApiKey();
  if (!apiKey) {
    return res.status(500).json({
      error: 'API credentials not configured',
      message: MISSING_KEY_MESSAGE,
    });
  }

  const relativePath =
    String(req.query.path ?? '')
      .split('?')[0]
      .replace(/^\/+|\/+$/g, '') ||
    req.originalUrl
      .replace(/^\/api\/openrouter/, '')
      .split('?')[0]
      .replace(/^\/+|\/+$/g, '');

  if (!relativePath) {
    return res.status(400).json({
      error: 'Missing path',
      message:
        'Call this proxy with ?path=<upstream path>, e.g. ?path=videos/models',
    });
  }

  const upstreamPath = `${OPENROUTER_API_PREFIX}/${relativePath}`;

  // Forward the remaining query params (e.g. index=0 on content downloads)
  // untouched. `path` itself is routing, not an upstream parameter.
  const forward = new URLSearchParams(req.query);
  forward.delete('path');
  const queryString = forward.toString();
  const upstreamUrl = `${OPENROUTER_ORIGIN}${upstreamPath}${
    queryString ? `?${queryString}` : ''
  }`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_APP_NAME) {
    headers['X-Title'] = process.env.OPENROUTER_APP_NAME;
  }

  try {
    const body =
      req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body || {})
        : undefined;

    const response = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
    });

    const contentType = response.headers.get('content-type') || '';

    // Stream generated video bytes straight through instead of JSON-encoding
    if (contentType.startsWith('video/') || contentType.startsWith('audio/')) {
      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Upstream error',
          message: (await response.text()).substring(0, 500),
        });
      }

      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      return res.status(200).send(Buffer.from(buffer));
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(response.status).json({
        error: 'Invalid JSON response from OpenRouter',
        raw: responseText.substring(0, 200),
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[OpenRouter] Proxy error:', error);
    return res.status(502).json({
      error: 'Could not reach OpenRouter',
      message: error instanceof Error ? error.message : 'Unknown network error',
    });
  }
});

async function start() {
  if (isProduction) {
    const dist = path.join(__dirname, 'dist');
    if (!fs.existsSync(dist)) {
      console.error('dist/ not found. Run "npm run build" first.');
      process.exit(1);
    }
    app.use(express.static(dist));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // One HTTP server for everything: API routes, uploaded videos, the app,
  // and (in dev) Vite's HMR websocket. A second listener is exactly what
  // produced the old ERR_CONNECTION_REFUSED spam on port 24678.
  //
  // If the preferred port is taken (stale process, second terminal), walk
  // upward instead of exiting. The frontend uses relative URLs, so any port
  // works - the banner always prints the URL that is actually live.
  const httpServer = await listenWithFallback(PREFERRED_PORT);

  if (!isProduction) {
    // Run Vite in middleware mode behind the same server.
    //
    // hmr.server attaches Vite's websocket to OUR http server. Without it,
    // Vite opens a second listener on port 24678, which produces
    // ERR_CONNECTION_REFUSED spam in the console whenever that listener is
    // blocked, conflicted, or bound to a different loopback family.
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  printBanner();
}

/**
 * Bind to the preferred port, walking upward when it is taken.
 *
 * A taken port almost always means a stale copy of this server (or a second
 * terminal). Exiting forces the user to hunt PIDs; moving to the next free
 * port keeps them working, and the banner prints the live URL.
 */
function listenWithFallback(preferred, attempts = 10) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, remaining) => {
      const server = app.listen(port, () => {
        if (port !== preferred) {
          console.log('');
          console.log(`  Port ${preferred} was busy - using ${port} instead.`);
          console.log('  Open the URL printed below, not the old tab.');
        }
        PORT = port;
        resolve(server);
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE' && remaining > 0) {
          tryPort(port + 1, remaining - 1);
          return;
        }
        if (error.code === 'EADDRINUSE') {
          console.error('');
          console.error(
            `  Ports ${preferred}-${port} are all busy. Stop the other node ` +
              `processes and run "npm run dev" again.`
          );
          console.error('');
          process.exit(1);
        }
        reject(error);
      });
    };

    tryPort(preferred, attempts);
  });
}

function printBanner() {
  const key = readApiKey();
  console.log('');
  console.log(`  AI-influencer`);
  console.log(`  ------------------------------------------`);
  console.log(`  URL        http://localhost:${PORT}`);
  console.log(`  Mode       ${isProduction ? 'production' : 'development'}`);
  console.log(
    `  API key    ${key ? 'configured' : 'MISSING - generation will fail'}`
  );
  console.log(`  Model      bytedance/seedance-2.0 (10s default)`);
  console.log(
    `  Public URL ${PUBLIC_URL || 'not set - using frame-reference fallback'}`
  );
  if (!key) {
    console.log('');
    console.log(`  ${MISSING_KEY_MESSAGE}`);
  }
  if (!PUBLIC_URL) {
    console.log('');
    console.log('  Note: OpenRouter requires the driver video to be a public HTTPS');
    console.log('  URL. Without PUBLIC_URL the app samples frames from your video,');
    console.log('  which approximates motion instead of transferring it exactly.');
    console.log('');
    console.log('  For exact transfer, expose this server and set PUBLIC_URL:');
    console.log('    cloudflared tunnel --url http://localhost:8080');
  }
  console.log('');
}

start();