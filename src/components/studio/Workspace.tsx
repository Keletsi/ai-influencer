import { Zap } from "lucide-react";
import { UploadCard } from "./UploadCard";
import { GenerateButton } from "./GenerateButton";
import { Badge } from "@/components/ui/badge";
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
  aspectRatio = "16:9",
  imageMeta = null,
  videoMeta = null,
  imagePreviewUrl = null,
  videoPreviewUrl = null,
  model = "Seedance 2.0",
  serverOnline = null,
}: WorkspaceProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 p-8 md:p-12 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 md:mb-12 flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">
            AI Influencer Studio
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Animate your virtual influencer from a portrait and a performance clip
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-white/50 backdrop-blur-md text-foreground px-3 py-1.5 h-8 gap-2 shadow-sm border border-black/5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {model}
          </Badge>
          <Badge className="bg-primary text-primary-foreground px-3 py-1.5 h-8 shadow-md border-0">
            OpenRouter
          </Badge>
        </div>
      </div>

      {/* Upload Area */}
      <div className="max-w-5xl mx-auto w-full flex-shrink-0">
        <div
          className={cn(
            "grid gap-8 relative mb-8",
            aspectRatio === "16:9" ? "grid-cols-1 items-center" : "grid-cols-2 items-start"
          )}
        >
          {/* Influencer Portrait */}
          <UploadCard
            type="image"
            label="Influencer"
            sublabel="Character Portrait"
            step={1}
            onFileSelect={onReferenceImageSelect}
            aspectRatio={aspectRatio}
            fileMeta={imageMeta}
            previewUrl={imagePreviewUrl}
          />

          {/* Performance Source */}
          <UploadCard
            type="video"
            label="Performance"
            sublabel="Driver Clip"
            step={2}
            onFileSelect={onMotionVideoSelect}
            aspectRatio={aspectRatio}
            fileMeta={videoMeta}
            previewUrl={videoPreviewUrl}
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-8 flex-shrink-0">
<div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className={cn(
              "backdrop-blur-md px-3 py-1.5 h-8 gap-2 shadow-sm border",
              serverOnline === false
                ? "bg-red-500/10 text-red-600 border-red-500/30"
                : "bg-white/50 text-foreground border-black/5"
            )}
            title={
              serverOnline === false
                ? 'Server unreachable - run "npm run dev" and reload'
                : serverOnline
                ? "Server reachable"
                : "Checking server..."
            }
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                serverOnline === false
                  ? "bg-red-500"
                  : serverOnline
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                  : "bg-muted-foreground/40 animate-pulse"
              )}
            />
            {serverOnline === false ? "Server down" : "Server"}
          </Badge>
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                hasRequiredFiles
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                  : "bg-muted-foreground/30"
              )}
            />
            <span className="text-sm font-medium text-muted-foreground">
              {hasRequiredFiles
                ? "Ready to generate"
                : "Add an influencer portrait and a performance clip to continue"}
            </span>
          </div>
          <GenerateButton
            onClick={onGenerate}
            isGenerating={isGenerating}
            disabled={!hasRequiredFiles}
          />
        </div>
      </div>
    </div>
  );
};