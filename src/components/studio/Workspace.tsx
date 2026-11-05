import { Zap, Circle } from "lucide-react";
import { UploadCard } from "./UploadCard";
import { GenerateButton } from "./GenerateButton";
import { cn } from "@/lib/utils";
import type { StoredFileMeta } from "@/services/local-storage";

interface WorkspaceProps {
  onGenerate?: () => void;
  isGenerating?: boolean;
  onReferenceImageSelect?: (file: File | null) => void;
  onMotionVideoSelect?: (file: File | null) => void;
  hasRequiredFiles?: boolean;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  imageMeta?: StoredFileMeta | null;
  videoMeta?: StoredFileMeta | null;
  imagePreviewUrl?: string | null;
  videoPreviewUrl?: string | null;
  model?: string;
  /** null = still checking, true = reachable, false = down */
  serverOnline?: boolean | null;
}

export const Workspace = ({
  onGenerate,
  isGenerating = false,
  onReferenceImageSelect,
  onMotionVideoSelect,
  hasRequiredFiles = false,
  aspectRatio = "9:16",
  imageMeta = null,
  videoMeta = null,
  imagePreviewUrl = null,
  videoPreviewUrl = null,
  model = "Seedance 2.0",
  serverOnline = null,
}: WorkspaceProps) => {
  return (
    <section className="rounded-xl border border-border bg-card">
      {/* Panel header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Compose your video
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            One portrait, one performance clip.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {model}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium",
              serverOnline === false
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : serverOnline
                  ? "border-primary/20 bg-secondary text-secondary-foreground"
                  : "border-border bg-muted/50 text-muted-foreground"
            )}
            title={
              serverOnline === false
                ? 'Server unreachable - run "npm run dev" and reload'
                : serverOnline
                  ? "Server reachable"
                  : "Checking server..."
            }
          >
            <Circle
              className={cn(
                "h-2 w-2",
                serverOnline === false
                  ? "fill-destructive text-destructive"
                  : serverOnline
                    ? "fill-primary text-primary"
                    : "fill-muted-foreground/40 text-muted-foreground/40"
              )}
            />
            {serverOnline === false ? "Server down" : "Server"}
          </span>
        </div>
      </div>

      {/* Uploads */}
      <div className="px-5 py-6 sm:px-6">
        <div
          className={cn(
            "grid gap-6",
            aspectRatio === "16:9" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"
          )}
        >
          <UploadCard
            type="image"
            label="Influencer portrait"
            sublabel="Your character, front-facing"
            step={1}
            onFileSelect={onReferenceImageSelect}
            aspectRatio={aspectRatio}
            fileMeta={imageMeta}
            previewUrl={imagePreviewUrl}
          />

          <UploadCard
            type="video"
            label="Performance clip"
            sublabel="The motion to copy"
            step={2}
            onFileSelect={onMotionVideoSelect}
            aspectRatio={aspectRatio}
            fileMeta={videoMeta}
            previewUrl={videoPreviewUrl}
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Circle
            className={cn(
              "h-2 w-2",
              hasRequiredFiles
                ? "fill-primary text-primary"
                : "fill-muted-foreground/30 text-muted-foreground/30"
            )}
          />
          {hasRequiredFiles
            ? "Both clips ready - you can generate"
            : "Add a portrait and a performance clip to continue"}
        </p>

        <GenerateButton
          onClick={onGenerate}
          isGenerating={isGenerating}
          disabled={!hasRequiredFiles}
        />
      </div>
    </section>
  );
};
