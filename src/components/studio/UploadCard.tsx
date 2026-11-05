import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, Video, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { StoredFileMeta } from "@/services/local-storage";

interface UploadCardProps {
  type: "image" | "video";
  label: string;
  sublabel?: string;
  step: number;
  className?: string;
  onFileSelect?: (file: File | null) => void;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  /** Metadata for a file restored from local storage on mount. */
  fileMeta?: StoredFileMeta | null;
  /** Revoked whenever the card unmounts or the file changes. */
  previewUrl?: string | null;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export const UploadCard = ({
  type,
  label,
  sublabel,
  step,
  className,
  onFileSelect,
  aspectRatio = "9:16",
  fileMeta = null,
  previewUrl = null,
}: UploadCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // The object URL created here must be released, otherwise every re-select
  // leaks the whole file in memory.
  useEffect(() => {
    if (!localPreview) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  // Restored files have no File object, so playback is disabled for them.
  const preview = localPreview ?? previewUrl;
  const hasPlayableFile = localPreview !== null;
  const sizeBytes = localPreview ? null : fileMeta?.size ?? null;

  const acceptedTypes =
    type === "image"
      ? "image/png,image/jpeg,image/jpg"
      : "video/mp4,video/quicktime,video/webm";

  const maxSize = type === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  const handleVideoHover = useCallback(
    (isHovering: boolean) => {
      if (!videoRef.current || !hasPlayableFile) return;
      if (isHovering) {
        videoRef.current.play().catch(() => {
          // Ignore autoplay errors before the user interacts
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    },
    [hasPlayableFile]
  );

  const processFile = useCallback(
    (selectedFile: File) => {
      const isValidType =
        type === "image"
          ? selectedFile.type.startsWith("image/")
          : selectedFile.type.startsWith("video/");

      if (!isValidType) {
        alert(`Please select a valid ${type} file`);
        return;
      }

      if (selectedFile.size > maxSize) {
        alert(`File size must be ${Math.round(maxSize / (1024 * 1024))}MB or less`);
        return;
      }

      setLocalPreview(URL.createObjectURL(selectedFile));
      onFileSelect?.(selectedFile);
    },
    [type, maxSize, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) processFile(droppedFile);
    },
    [processFile]
  );

  const handleClick = () => fileInputRef.current?.click();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleRemove = () => {
    setLocalPreview(null);
    onFileSelect?.(null);
  };

  const Icon = type === "image" ? ImageIcon : Video;

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "16:9":
        return "aspect-[16/9]";
      case "1:1":
        return "aspect-square";
      case "9:16":
      default:
        return "aspect-[4/5] sm:aspect-[9/16]";
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Step header */}
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-foreground">
            {label}
          </h3>
          {sublabel && (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {sublabel}
            </p>
          )}
        </div>
      </div>

      {!preview ? (
        <button
          type="button"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "relative w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors",
            getAspectRatioClass(),
            isDragging
              ? "border-primary bg-secondary"
              : "border-border bg-muted/40 hover:border-primary/50 hover:bg-secondary/60"
          )}
        >
          <span className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <span
              className={cn(
                "mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background transition-colors",
                isDragging && "border-primary"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 text-muted-foreground",
                  (isDragging || undefined) && "text-primary"
                )}
              />
            </span>

            <span className="text-sm font-medium text-foreground">
              Drop {type} here
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              or click to browse
            </span>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <Upload className="h-3 w-3" />
              {type === "image" ? "PNG, JPG up to 10MB" : "MP4, MOV up to 20MB"}
            </span>
          </span>
        </button>
      ) : (
        <div
          className={cn(
            "group relative overflow-hidden rounded-xl border border-border bg-muted",
            getAspectRatioClass()
          )}
          onMouseEnter={() => type === "video" && handleVideoHover(true)}
          onMouseLeave={() => type === "video" && handleVideoHover(false)}
        >
          {type === "image" ? (
            <img
              src={preview}
              alt="Influencer portrait"
              className="h-full w-full object-cover"
            />
          ) : hasPlayableFile ? (
            <video
              ref={videoRef}
              src={preview}
              className="h-full w-full object-cover"
              loop
              muted
              playsInline
            />
          ) : (
            // Restored from IndexedDB: no File handle to stream, show the still
            <div className="flex h-full w-full items-center justify-center">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {/* Hover actions - solid, not frosted */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClick}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>

          {/* Type badge */}
          <div className="absolute left-3 top-3">
            <span className="rounded-md bg-foreground/80 px-2 py-1 text-[11px] font-medium text-background">
              {type === "image" ? "Portrait" : "Performance"}
            </span>
          </div>

          {sizeBytes !== null && (
            <div className="absolute bottom-3 right-3">
              <span className="rounded-md bg-foreground/80 px-2 py-1 font-mono text-[11px] text-background">
                {(sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
