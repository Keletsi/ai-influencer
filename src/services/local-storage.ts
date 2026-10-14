/**
 * Local-only storage for the studio.
 *
 * Files live in IndexedDB so they survive a page refresh without any cloud
 * bucket, and are converted to base64 data URLs for the OpenRouter video API
 * (which accepts data URLs for both image and video references).
 */

const DB_NAME = 'motion-studio';
const DB_VERSION = 1;
const FILE_STORE = 'files';

export interface StoredFileMeta {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/** Hard ceiling on what we will base64-encode and send. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20MB

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      console.warn('[LocalStorage] IndexedDB unavailable, files will not persist');
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('[LocalStorage] Failed to open database:', request.error);
      resolve(null);
    };
  });

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return openDatabase().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }

        let request: IDBRequest<T>;
        try {
          request = action(db.transaction(FILE_STORE, mode).objectStore(FILE_STORE));
        } catch (error) {
          console.error('[LocalStorage] Transaction failed:', error);
          resolve(null);
          return;
        }

        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => {
          console.error('[LocalStorage] Request failed:', request.error);
          resolve(null);
        };
      })
  );
}

/** Persist a File/Blob in IndexedDB. */
export async function saveFile(key: string, file: File | Blob): Promise<boolean> {
  const stored = await runTransaction<IDBValidKey>(
    'readwrite',
    (store) => store.put(file, key)
  );
  return stored !== null;
}

/** Read a previously saved File/Blob. */
export async function getFile(key: string): Promise<File | null> {
  const blob = await runTransaction<Blob>('readonly', (store) => store.get(key));
  if (!blob) return null;

  if (blob instanceof File) return blob;

  // IndexedDB can return a bare Blob depending on the browser
  return new File([blob], 'file', { type: blob.type });
}

/** Remove a stored file. */
export async function deleteFile(key: string): Promise<void> {
  await runTransaction<undefined>('readwrite', (store) => store.delete(key));
}

const META_PREFIX = 'motion-studio-meta:';

function saveMeta(key: string, meta: StoredFileMeta): void {
  try {
    localStorage.setItem(META_PREFIX + key, JSON.stringify(meta));
  } catch (error) {
    console.warn('[LocalStorage] Could not persist metadata:', error);
  }
}

function loadMeta(key: string): StoredFileMeta | null {
  try {
    const raw = localStorage.getItem(META_PREFIX + key);
    return raw ? (JSON.parse(raw) as StoredFileMeta) : null;
  } catch {
    return null;
  }
}

/** Save a file plus its display metadata. */
export async function persistFile(key: string, file: File): Promise<void> {
  const meta: StoredFileMeta = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
  await saveFile(key, file);
  saveMeta(key, meta);
}

/** Metadata for a stored file, if present. */
export function getFileMeta(key: string): StoredFileMeta | null {
  return loadMeta(key);
}

/** Delete a stored file and its metadata. */
export async function clearFile(key: string): Promise<void> {
  await deleteFile(key);
  try {
    localStorage.removeItem(META_PREFIX + key);
  } catch {
    // Non-fatal
  }
}

const SETTINGS_KEY = 'motion-studio-settings';
const DURATION_KEY = 'motion-studio-duration';

export function saveSettings(settings: unknown): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('[LocalStorage] Could not persist settings:', error);
  }
}

export function loadSettings<T>(): T | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveVideoDuration(duration: number): void {
  try {
    localStorage.setItem(DURATION_KEY, String(duration));
  } catch (error) {
    console.warn('[LocalStorage] Could not persist duration:', error);
  }
}

export function loadVideoDuration(): number | null {
  try {
    const raw = localStorage.getItem(DURATION_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Convert a File/Blob into a base64 data URL.
 *
 * OpenRouter accepts data URLs for image and video references, which is what
 * lets the studio run entirely on local files with no cloud bucket.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as a data URL'));
      }
    };

    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Read a video's duration in seconds from a local file.
 */
export function readVideoDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      cleanup();
      if (Number.isFinite(duration) && duration > 0) {
        resolve(duration);
      } else {
        reject(new Error('Could not read video duration'));
      }
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to read video metadata'));
    };

    video.src = objectUrl;
  });
}

/**
 * Sample evenly spaced frames from a video as JPEG data URLs.
 *
 * This is the fallback for when the driver video cannot be served from a
 * public HTTPS URL, which OpenRouter requires for a `video_url` reference.
 * The model receives the motion as a storyboard of key frames instead.
 */
export async function extractVideoFrames(
  file: File | Blob,
  frameCount = 8,
  maxWidth = 768
): Promise<string[]> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');

  try {
    await new Promise<void>((resolve, reject) => {
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video for frame extraction'));
      video.src = objectUrl;
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Video has no readable duration');
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) throw new Error('Video has no readable dimensions');

    const scale = Math.min(1, maxWidth / width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      // Sample from just after the start to just before the end so every
      // frame carries real motion rather than a black lead-in.
      const t = (duration * (i + 0.5)) / frameCount;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        video.currentTime = Math.min(t, duration - 0.05);
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.82));
    }

    return frames;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}