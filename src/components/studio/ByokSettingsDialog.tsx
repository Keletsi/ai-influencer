import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  clearApiKey,
  getApiKey,
  isValidKeyFormat,
  maskApiKey,
  setApiKey,
} from "@/services/api-key";

interface ByokSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the key is saved or removed so the page can re-check health. */
  onKeyChanged?: () => void;
  /** Server-side .env key present - generation still works without BYOK. */
  serverKeyConfigured?: boolean;
  /** Server reports it can host the driver video for exact motion transfer. */
  canHostVideo?: boolean;
}

/**
 * BYOK configuration. The key is written to localStorage only; it is never
 * posted anywhere except our own /api proxy, one request at a time.
 */
export const ByokSettingsDialog = ({
  open,
  onOpenChange,
  onKeyChanged,
  serverKeyConfigured = false,
  canHostVideo = false,
}: ByokSettingsDialogProps) => {
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the dialog opens, so it always reflects storage.
  useEffect(() => {
    if (!open) return;
    setValue("");
    setRevealed(false);
    setError(null);
    setSavedKey(getApiKey());
  }, [open]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste your OpenRouter key first.");
      return;
    }
    if (!isValidKeyFormat(trimmed)) {
      setError("That does not look like an OpenRouter key. It should start with sk-or-.");
      return;
    }

    setApiKey(trimmed);
    setSavedKey(getApiKey());
    setValue("");
    setRevealed(false);
    setError(null);
    onKeyChanged?.();
  };

  const handleRemove = () => {
    clearApiKey();
    setSavedKey(null);
    setValue("");
    setError(null);
    onKeyChanged?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Your OpenRouter key
          </DialogTitle>
          <DialogDescription>
            Bring your own key and generation runs on your own credits. The key
            is stored in this browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Current state */}
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-sm",
              savedKey
                ? "border-primary/20 bg-secondary"
                : "border-border bg-muted/50"
            )}
          >
            {savedKey ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                {savedKey ? "Key saved in this browser" : "No personal key yet"}
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {savedKey
                  ? maskApiKey(savedKey)
                  : serverKeyConfigured
                    ? "Falling back to the server's key"
                    : "Generation will fail until a key is added"}
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="openrouter-key">
              {savedKey ? "Replace key" : "API key"}
            </Label>
            <div className="relative">
              <Input
                id="openrouter-key"
                type={revealed ? "text" : "password"}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSave();
                }}
                placeholder="sk-or-v1-..."
                autoComplete="off"
                spellCheck={false}
                className="pr-11 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setRevealed((previous) => !previous)}
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={revealed ? "Hide key" : "Show key"}
              >
                {revealed ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Stored locally with <code>localStorage</code>. Never committed,
                never written to the server's disk.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  canHostVideo ? "bg-primary" : "bg-amber-500"
                )}
              />
              Motion mode:{" "}
              <span className="font-medium text-foreground">
                {canHostVideo
                  ? "exact video reference"
                  : "frame-reference fallback"}
              </span>
            </p>
            {!canHostVideo && (
              <p>
                The server has no public URL, so motion is sampled from key
                frames. Set <code>PUBLIC_URL</code> to enable exact transfer.
              </p>
            )}
          </div>

          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Create a key on OpenRouter
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {savedKey ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Remove key
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button type="button" onClick={handleSave} disabled={!value.trim()}>
              Save key
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
