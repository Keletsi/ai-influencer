import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Film,
  Loader2,
  Play,
  RotateCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_DURATION_SECONDS, openRouterApi } from "@/services/openrouter";
import {
  HISTORY_CHANGED_EVENT,
  clearRenders,
  listRenders,
  removeRender,
} from "@/services/history";
import type { RenderRecord } from "@/services/history";

interface PreviewState {
  status: "idle" | "loading" | "ready" | "error";
  url?: string;
  error?: string;
}

function relativeTime(timestamp: number): string {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

const STATUS_STYLES: Record<RenderRecord["status"], string> = {
  completed: "border-primary/20 bg-secondary text-secondary-foreground",
  processing: "border-amber-300 bg-amber-50 text-amber-800",
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  failed: "border-destructive/30 bg-destructive/5 text-destructive",
};

/**
 * "Advertise what you made": every job id this browser submitted, with a
 * one-click re-fetch so a finished render can be watched again without paying
 * for a second generation.
 *
 * OpenRouter has no list endpoint (GET /api/v1/videos is 404), so this index
 * is built locally as jobs are submitted - see services/history.ts.
 */
export const RecentRenders = () => {
  const [records, setRecords] = useState<RenderRecord[]>([]);
  const [previews, setPreviews] = useState<Record<string, PreviewState>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = useCallback(() => setRecords(listRenders()), []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(HISTORY_CHANGED_EVENT, onChange);
    window.addEventListener("focus", onChange);
    return () => {
      window.removeEventListener(HISTORY_CHANGED_EVENT, onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [refresh]);

  const handlePreview = useCallback(
    async (record: RenderRecord) => {
      setPreviews((previous) => ({
        ...previous,
        [record.taskId]: { status: "loading" },
      }));

      try {
        const result = await openRouterApi.recoverJob(
          record.taskId,
          record.model,
          record.duration ?? DEFAULT_DURATION_SECONDS
        );

        const url = result.result?.videoUrl;
        if (!url) throw new Error("The render finished but returned no video.");

        setPreviews((previous) => ({
          ...previous,
          [record.taskId]: { status: "ready", url },
        }));
        refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load this render";
        setPreviews((previous) => ({
          ...previous,
          [record.taskId]: { status: "error", error: message },
        }));
      }
    },
    [refresh]
  );

  const handleCopy = useCallback(async (taskId: string) => {
    try {
      await navigator.clipboard.writeText(taskId);
      setCopiedId(taskId);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard blocked - the id is still selectable on screen
    }
  }, []);

  const handleRemove = useCallback(
    (taskId: string) => {
      removeRender(taskId);
      setPreviews((previous) => {
        const next = { ...previous };
        delete next[taskId];
        return next;
      });
      refresh();
    },
    [refresh]
  );

  return (
    <section id="recent-renders" className="scroll-mt-24">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Recent renders
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every video generated in this browser, indexed by job ID. Re-open a
            finished render without paying for it twice.
          </p>
        </div>
        {records.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 self-start gap-2 text-muted-foreground hover:text-destructive sm:mt-0"
            onClick={() => {
              clearRenders();
              setPreviews({});
              refresh();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear history
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Film className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            No renders yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Your first video will appear here with its job ID, model and status
            as soon as you hit Generate.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => {
            const preview = previews[record.taskId] ?? { status: "idle" as const };

            return (
              <article
                key={record.taskId}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* Preview surface */}
                <div className="relative aspect-video bg-muted">
                  {preview.status === "ready" && preview.url ? (
                    <video
                      src={preview.url}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      {preview.status === "loading" ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-xs">Fetching render...</span>
                        </>
                      ) : preview.status === "error" ? (
                        <>
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <span className="px-4 text-center text-xs text-destructive">
                            {preview.error}
                          </span>
                        </>
                      ) : (
                        <>
                          <Film className="h-6 w-6" />
                          <span className="text-xs">
                            {record.status === "completed"
                              ? "Ready to preview"
                              : `Status: ${record.status}`}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <span
                    className={cn(
                      "absolute left-3 top-3 rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize",
                      STATUS_STYLES[record.status]
                    )}
                  >
                    {record.status}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {record.model}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {relativeTime(record.createdAt)}
                      {record.duration ? ` • ${record.duration}s` : ""}
                      {record.aspectRatio ? ` • ${record.aspectRatio}` : ""}
                    </p>
                  </div>

                  {/* The ID itself, advertised and copyable */}
                  <button
                    type="button"
                    onClick={() => handleCopy(record.taskId)}
                    className="group flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-left transition-colors hover:border-primary/40 hover:bg-secondary"
                    title="Copy job ID"
                  >
                    <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
                      {record.taskId}
                    </code>
                    {copiedId === record.taskId ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                    )}
                  </button>

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={record.status === "completed" ? "default" : "outline"}
                      className="flex-1 gap-1.5"
                      disabled={preview.status === "loading"}
                      onClick={() => handlePreview(record)}
                    >
                      {preview.status === "loading" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : preview.status === "ready" ? (
                        <RotateCw className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      {preview.status === "ready" ? "Reload" : "Preview"}
                    </Button>

                    {preview.status === "ready" && preview.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        asChild
                      >
                        <a
                          href={preview.url}
                          download={`ai-influencer-${record.taskId}.mp4`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="sr-only">Download</span>
                        </a>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="px-2 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(record.taskId)}
                      aria-label="Remove from history"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
