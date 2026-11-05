import { useState, useCallback, useEffect, useRef } from "react";
import { KeyRound, Sparkles, Upload, Wand2, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { HeroBackdrop, SampleShowcase } from "@/components/layout/HeroMedia";
import { Workspace } from "@/components/studio/Workspace";
import { SettingsPanel } from "@/components/studio/SettingsPanel";
import { RecentRenders } from "@/components/studio/RecentRenders";
import { ByokSettingsDialog } from "@/components/studio/ByokSettingsDialog";
import { Button } from "@/components/ui/button";
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
import { API_KEY_CHANGED_EVENT, hasApiKey } from "@/services/api-key";
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

  // Live server reachability + key state shown in the header
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [keySource, setKeySource] = useState<"byok" | "server" | "none">("none");
  const [canHostVideo, setCanHostVideo] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

      const [image, video] = await Promise.all([getFile(IMAGE_KEY), getFile(VIDEO_KEY)]);
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

  /**
   * Verify the server and the API key up front, so a misconfiguration shows up
   * immediately instead of after a full render. Re-runs whenever the BYOK key
   * changes so the header reflects the new state.
   */
  const refreshHealth = useCallback(async () => {
    try {
      const health = await openRouterApi.getHealth();
      if (!mountedRef.current) return;

      setServerOnline(health.reachable);
      setKeyConfigured(health.configured);
      setKeySource(health.keySource ?? (hasApiKey() ? "byok" : "none"));
      setCanHostVideo(health.canHostVideo);
    } catch (error) {
      if (!mountedRef.current) return;
      setServerOnline(false);
      setKeyConfigured(false);
      console.error("[Index] Health check failed:", error);
    }
  }, []);

  useEffect(() => {
    setSavedJob(loadLastJob());
    refreshHealth();

    const onKeyChanged = () => {
      refreshHealth();
      // Let the tooltip/status settle before nudging the user
      toast.success("API key updated", {
        description: "Your OpenRouter key is now stored in this browser.",
      });
    };

    window.addEventListener(API_KEY_CHANGED_EVENT, onKeyChanged);
    return () => window.removeEventListener(API_KEY_CHANGED_EVENT, onKeyChanged);
  }, [refreshHealth]);

  const hasRequiredFiles = referenceImage !== null && motionVideo !== null;

  const handleGenerate = useCallback(async () => {
    const image = referenceImage;
    const video = motionVideo;

    if (!image || !video) {
      toast.error("Missing files", {
        description: "Please add both an influencer portrait and a performance clip",
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
      if (mountedRef.current) {
        setServerOnline(health.reachable);
        setKeyConfigured(health.configured);
        setKeySource(health.keySource ?? (hasApiKey() ? "byok" : "none"));
      }

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
        toast.error("Add your OpenRouter key", {
          description: health.message,
          duration: 15000,
          action: { label: "Settings", onClick: () => setSettingsOpen(true) },
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
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        keyConfigured={keyConfigured}
        keySource={keySource}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-secondary/40">
          <HeroBackdrop />
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Virtual influencer studio
                </span>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Put your AI influencer
                  <span className="text-primary"> on camera</span>
                </h1>

                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Upload a portrait and a performance clip. AI-influencer copies the
                  movement, timing and camera work onto your character and returns a
                  share-ready video.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button size="lg" className="gap-2" asChild>
                    <a href="#compose">
                      Start a render
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2" onClick={() => setSettingsOpen(true)}>
                    <KeyRound className="h-4 w-4" />
                    {keyConfigured ? "Manage API key" : "Add your API key"}
                  </Button>
                </div>

                {!keyConfigured && serverOnline !== false && (
                  <p className="mt-4 text-sm text-amber-800">
                    No OpenRouter key detected. Add your own key to generate on your
                    own credits — it stays in this browser.
                  </p>
                )}
              </div>

              <SampleShowcase />
            </div>
          </div>
        </section>

        {/* Generator */}
        <section
          id="compose"
          className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
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

            <div className="lg:sticky lg:top-24">
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
        </section>

        {/* Recent renders */}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <RecentRenders />
        </div>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
        >
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            How it works
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Three steps, no timeline editing.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Upload,
                title: "Upload",
                body: "A front-facing portrait of your influencer and a clip with the movement you want.",
              },
              {
                icon: Wand2,
                title: "Generate",
                body: "Pick resolution, format and motion strength, then send the job to your OpenRouter key.",
              },
              {
                icon: Sparkles,
                title: "Publish",
                body: "Preview and download the finished video. It stays indexed by job ID for later.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <step.icon className="h-4 w-4 text-primary" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AppFooter />

      <ByokSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onKeyChanged={refreshHealth}
        serverKeyConfigured={keySource === "server"}
        canHostVideo={canHostVideo}
      />
    </div>
  );
};

export default Index;
