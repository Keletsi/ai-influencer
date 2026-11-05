/**
 * Local render history.
 *
 * OpenRouter has no "list my videos" endpoint (GET /api/v1/videos returns
 * 404), so we keep our own index of every job this browser submitted. Each
 * record holds the job id needed to re-fetch a finished render, which is what
 * lets the app advertise recent work without paying for a second generation.
 */

export type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RenderRecord {
  /** OpenRouter video job id - the key used to recover the render. */
  taskId: string;
  model: string;
  /** Epoch ms when the job was submitted. */
  createdAt: number;
  status: RenderStatus;
  prompt?: string;
  aspectRatio?: string;
  duration?: number;
}

const STORAGE_KEY = 'ai-influencer-render-history';

/** Newest first, capped so localStorage cannot grow without bound. */
const MAX_RECORDS = 12;

export const HISTORY_CHANGED_EVENT = 'ai-influencer:history-changed';

function read(): RenderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RenderRecord =>
        typeof item?.taskId === 'string' && item.taskId.length > 0
    );
  } catch {
    return [];
  }
}

function write(records: RenderRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    // Non-fatal: history is a convenience, not required for generation
  }
  try {
    window.dispatchEvent(new Event(HISTORY_CHANGED_EVENT));
  } catch {
    // Non-browser environment
  }
}

export function listRenders(): RenderRecord[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

/** Insert or merge a record. Re-submitting the same id updates it in place. */
export function recordRender(record: RenderRecord): void {
  const existing = read();
  const withoutCurrent = existing.filter((item) => item.taskId !== record.taskId);
  write([record, ...withoutCurrent]);
}

export function updateRender(
  taskId: string,
  patch: Partial<Omit<RenderRecord, 'taskId'>>
): void {
  const existing = read();
  const index = existing.findIndex((item) => item.taskId === taskId);
  if (index === -1) return;

  const next = [...existing];
  next[index] = { ...next[index], ...patch };
  write(next);
}

export function removeRender(taskId: string): void {
  write(read().filter((item) => item.taskId !== taskId));
}

export function clearRenders(): void {
  write([]);
}
