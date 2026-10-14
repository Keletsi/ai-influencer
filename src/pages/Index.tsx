import { useState, useCallback, useEffect, useRef } from "react";
import { Sidebar } from "@/components/studio/Sidebar";
import { Workspace } from "@/components/studio/Workspace";
import { SettingsPanel } from "@/components/studio/SettingsPanel";
import { BackgroundEffects } from "@/components/ui/background-effects";
import { openRouterApi, MOTION_TRANSFER_MODEL, DEFAULT_DURATION_SECONDS } from "@/services/openrouter";
import type { TransferMode } from "@/services/openrouter";
import { loadLastJob, clearLastJob } from "@/services/openrouter";
import type { SavedJob } from "@/services/openrouter";
import {
  persistFile,
  getFile,
  getFileMeta,
  clearFile,
  saveSettings,
  loadSettings,
  saveVideoDuration,
  loadVideoDuration,
  readVideoDuration,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "@/services/local-storage";
import type { StoredFileMeta } from "@/services/local-storage";
import { toast } from "sonner";
import type { GenerationSettings, UnifiedTaskResult } from "@/types/motion";

const IMAGE_KEY = "referenceImage";
const VIDEO_KEY = "motionVideo";

const DEFAULT_SETTINGS: GenerationSettings = {
  motionStrength: 65,
  matchMode: "structure",
  negativePrompt: "",
  quality: "720p",
  aspectRatio: "9:16",
  prompt: "",
};

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [motionVideo, setMotionVideo] = useState<File | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [videoDuration, setVideoDuration] = useState<number>(DEFAULT_DURATION_SECONDS);
  const [result, setResult] = useState<UnifiedTaskResult | undefined>();
  const [creditsUsed, setCreditsUsed] = useState<number | undefined>();
  const [model, setModel] = useState<string>(MOTION_TRANSFER_MODEL);
  const [transferMode, setTransferMode] = useState<TransferMode | null>(null);
  const [imageMeta, setImageMeta] = useState<StoredFileMeta | null>(null);
  const [videoMeta, setVideoMeta] = useState<StoredFileMeta | null>(null);
  // Live server reachability shown in the header
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  // Most recent submitted job, for recovering a finished render
  const [savedJob, setSavedJob] = useState<SavedJob | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  // Object URLs for restored files so the cards can render a thumbnail
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Guards against state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Restore files + settings from local storage on mount
  useEffect(() => {
    const restore = async () => {
      const savedSettings = loadSettings<GenerationSettings>();
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
      }

      const savedDuration = loadVideoDuration();
      if (savedDuration) setVideoDuration(savedDuration);

      const [image, video] = await Promise.all([
        getFile(IMAGE_KEY),
        getFile(VIDEO_KEY),
      ]);
      if (!mountedRef.current) return;

      if (image) {
        setReferenceImage(image);
        setImageMeta(getFileMeta(IMAGE_KEY));
        setImagePreviewUrl(URL.createObjectURL(image));
      }
      if (video) {
        setMotionVideo(video);
        setVideoMeta(getFileMeta(VIDEO_KEY));
        setVideoPreviewUrl(URL.createObjectURL(video));
      }
    };

    restore();
  }, []);

  // Release restored preview URLs on unmount
  useEffect(
    () => () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    },
    [imagePreviewUrl, videoPreviewUrl]
  );

  // Verify the server and API key up front, so a misconfiguration shows up
  // immediately instead of after a full render - and so a dead server is not
  // misreported as a bad API key.
  useEffect(() => {
    let cancelled = false;

    openRouterApi
      .getHealth()
      .then((health) => {
        if (cancelled) return;
        setServerOnline(health.reachable);
        setSavedJob(loadLastJob());
        if (health.configured) return;

        toast.error(
          health.reachable
            ? "OpenRouter API key not configured"
            : "Cannot reach the app server",
          {
            description: health.message,
            duration: 15000,
          }
        );
      })
      .catch((error) => {
        if (!cancelled) setServerOnline(false);
        console.error("[Index] Health check failed:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasRequiredFiles = referenceImage !== null && motionVideo !== null;

  const handleGenerate = useCallback(async () => {
    const image = referenceImage;
    const video = motionVideo;

    if (!image || !video) {
      toast.error("Missing files", {
        description:
          "Please add both an influencer portrait and a performance clip",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Submitting to OpenRouter...");
    setResult(undefined);
    setCreditsUsed(undefined);

    try {
      setGenerationStatus("Checking the server...");

      // Preflight: fail fast with instructions instead of a bare fetch error
      // halfway through reading files or streaming a 30MB request body.
      const health = await openRouterApi.getHealth();
      if (mountedRef.current) setServerOnline(health.reachable);
      if (!health.reachable) {
        setGenerationStatus("Server unreachable");
        toast.error("Cannot reach the app server", {
          description: health.message,
          duration: 15000,
        });
        setIsGenerating(false);
        return;
      }
      if (!health.configured) {
        setGenerationStatus("API key missing");
        toast.error("OpenRouter API key not configured", {
          description: health.message,
          duration: 15000,
        });
        setIsGenerating(false);
        return;
      }

      setGenerationStatus("Preparing your files...");

      const taskResult = await openRouterApi.generateMotionTransfer(
        {
          imageFile: image,
          videoFile: video,
          motionStrength: settings.motionStrength,
          matchMode: settings.matchMode,
          duration: videoDuration,
          negativePrompt: settings.negativePrompt,
          quality: settings.quality,
          aspectRatio: settings.aspectRatio,
          prompt: settings.prompt,
        },
        async (progress, status, credits) => {
          if (!mountedRef.current) return;
          setGenerationProgress(progress);
          setGenerationStatus(
            status === "processing"
              ? "Rendering your influencer video..."
              : status === "pending"
              ? "Waiting in the queue..."
              : status === "completed"
              ? "Downloading result..."
              : "Finishing up..."
          );
          if (credits !== undefined) setCreditsUsed(credits);
        }
      );

      if (!mountedRef.current) return;

      if (taskResult.status === "completed" && taskResult.result) {
        setModel(taskResult.model);
        setTransferMode(taskResult.transferMode ?? null);
        setResult(taskResult);
        setGenerationProgress(100);
        setGenerationStatus("Complete!");
        setCreditsUsed(taskResult.result.creditsUsed);

        const costMessage = taskResult.result.creditsUsed
          ? ` • $${taskResult.result.creditsUsed.toFixed(4)}`
          : "";

        toast.success("Generation complete!", {
          description: `Ready via ${taskResult.model}${costMessage}`,
        });

        if (taskResult.transferMode === "frame-reference") {
          toast.info("Motion was approximated from key frames", {
            description:
              "Set PUBLIC_URL and expose the server over HTTPS for exact performance transfer.",
            duration: 12000,
          });
        }
      } else {
        setGenerationStatus("Failed");
        toast.error("Generation failed", {
          description: taskResult.error || "OpenRouter did not return a video",
        });
      }
    } catch (error) {
      console.error("[Index] Generation error:", error);
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";

      if (mountedRef.current) {
        setGenerationStatus("Failed");
        toast.error("Generation failed", {
          description: message,
          duration: 10000,
        });
      }
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, [referenceImage, motionVideo, settings, videoDuration]);

  const handleReferenceImageSelect = useCallback(async (file: File | null) => {
    if (!file) {
      setReferenceImage(null);
      setImageMeta(null);
      setImagePreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      await clearFile(IMAGE_KEY);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large", {
        description: "Influencer portraits must be 10MB or smaller",
      });
      return;
    }

    setReferenceImage(file);
    setImageMeta({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    await persistFile(IMAGE_KEY, file);
  }, []);

  const handleMotionVideoSelect = useCallback(async (file: File | null) => {
    if (!file) {
      setMotionVideo(null);
      setVideoMeta(null);
      setVideoDuration(DEFAULT_DURATION_SECONDS);
      setVideoPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      await clearFile(VIDEO_KEY);
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Video is too large", {
        description: "Performance clips must be 20MB or smaller",
      });
      return;
    }

    setMotionVideo(file);
    setVideoMeta({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    await persistFile(VIDEO_KEY, file);

    try {
      const duration = await readVideoDuration(file);
      if (mountedRef.current) {
        setVideoDuration(duration);
        saveVideoDuration(duration);
      }
    } catch (error) {
      console.warn("[Index] Could not read video duration:", error);
    }
  }, []);

  const handleSettingsChange = useCallback((newSettings: GenerationSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  /**
   * Recover the most recent submitted job: if it finished, download the
   * video into this session. For the stranded render, this is how the paid
   * video gets retrieved without paying twice.
   */
  const handleRecover = useCallback(async () => {
    const job = savedJob;
    if (!job || isRecovering) return;

    setIsRecovering(true);
    setGenerationStatus("Looking up your last render...");

    try {
      const recovered = await openRouterApi.recoverJob(
        job.taskId,
        job.model,
        videoDuration
      );

      setResult(recovered);
      setModel(recovered.model);
      setTransferMode(recovered.transferMode ?? null);
      setGenerationProgress(100);
      setGenerationStatus("Complete!");
      setCreditsUsed(recovered.result?.creditsUsed);

      toast.success("Video recovered!", {
        description: `Your ${recovered.model} render is ready to watch and download.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      if ((error as Error & { code?: string })?.code === "JOB_NOT_DONE") {
        toast.info("Render still running", { description: message });
        setGenerationStatus("Waiting in the queue...");
      } else {
        // Gone (expired, deleted, or failed): stop offering it.
        clearLastJob();
        setSavedJob(null);
        setGenerationStatus("");
        toast.error("Could not recover the video", { description: message });
      }
    } finally {
      setIsRecovering(false);
    }
  }, [savedJob, isRecovering, videoDuration]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <BackgroundEffects />

      {/* Sidebar */}
      <div className="relative z-10 h-full">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 relative z-10">
        {/* Workspace */}
        <Workspace
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onReferenceImageSelect={handleReferenceImageSelect}
          onMotionVideoSelect={handleMotionVideoSelect}
          hasRequiredFiles={hasRequiredFiles}
          aspectRatio={settings.aspectRatio}
          imageMeta={imageMeta}
          videoMeta={videoMeta}
          imagePreviewUrl={imagePreviewUrl}
          videoPreviewUrl={videoPreviewUrl}
          model={model}
          serverOnline={serverOnline}
        />

        {/* Fade effects around Settings Panel - 13px */}
        <div
          className="absolute right-[360px] top-0 bottom-0 bg-gradient-to-r from-transparent via-card/60 to-card/80 pointer-events-none z-20"
          style={{ width: "13px" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-transparent via-card/60 to-card/80 pointer-events-none z-20"
          style={{ width: "13px" }}
        />

        {/* Settings Panel */}
        <SettingsPanel
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          generationStatus={generationStatus}
          result={result}
          creditsUsed={creditsUsed}
          videoDuration={videoDuration}
          transferMode={transferMode}
          savedJob={savedJob}
          isRecovering={isRecovering}
          onRecover={handleRecover}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    </div>
  );
};

export default Index;