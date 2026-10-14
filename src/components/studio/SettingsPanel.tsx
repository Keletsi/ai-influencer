import { useState } from "react";
import {
  Settings,
  Sparkles,
  Download,
  Maximize,
  CheckCircle2,
  Coins,
  History,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GenerationSettings, UnifiedTaskResult } from "@/types/motion";
import type { TransferMode, SavedJob } from "@/services/openrouter";

interface SettingsPanelProps {
  isGenerating?: boolean;
  generationProgress?: number;
  generationStatus?: string;
  result?: UnifiedTaskResult;
  creditsUsed?: number;
videoDuration?: number;
  transferMode?: TransferMode | null;
  savedJob?: SavedJob | null;
  isRecovering?: boolean;
  onRecover?: () => void;
  onSettingsChange?: (settings: GenerationSettings) => void;
}

export const SettingsPanel = ({
  isGenerating = false,
  generationProgress = 0,
  generationStatus = '',
  result,
  creditsUsed,
  videoDuration,
  transferMode = null,
  savedJob = null,
  isRecovering = false,
  onRecover,
  onSettingsChange,
}: SettingsPanelProps) => {
  const [motionStrength, setMotionStrength] = useState([65]);
  const [matchMode, setMatchMode] = useState<"structure" | "motion">("structure");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [prompt, setPrompt] = useState("");
  const [quality, setQuality] = useState<"720p" | "1080p">("720p");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");

  const updateSettings = (updates: Partial<GenerationSettings>) => {
    onSettingsChange?.({
      motionStrength: motionStrength[0],
      matchMode,
      negativePrompt,
      quality,
      aspectRatio,
      prompt,
      ...updates,
    });
  };

  const handleMotionStrengthChange = (value: number[]) => {
    setMotionStrength(value);
    updateSettings({ motionStrength: value[0] });
  };

  const handleMatchModeChange = (value: string) => {
    const mode = value as "structure" | "motion";
    setMatchMode(mode);
    updateSettings({ matchMode: mode });
  };

  const handleNegativePromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setNegativePrompt(value);
    updateSettings({ negativePrompt: value });
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);
    updateSettings({ prompt: value });
  };

  const handleQualityChange = (value: string) => {
    const newQuality = value as "720p" | "1080p";
    setQuality(newQuality);
    updateSettings({ quality: newQuality });
  };

  const handleAspectRatioChange = (value: string) => {
    const newRatio = value as "16:9" | "9:16" | "1:1";
    setAspectRatio(newRatio);
    updateSettings({ aspectRatio: newRatio });
  };

  const handleDownload = () => {
    if (result?.result?.videoUrl) {
      const link = document.createElement("a");
      link.href = result.result.videoUrl;
      link.download = "ai-influencer-clip.mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="w-[360px] bg-card/80 backdrop-blur-xl flex flex-col h-screen shadow-2xl shadow-black/5 z-20 relative">
      <Tabs defaultValue="settings" className="flex flex-col h-full overflow-hidden relative z-20">
        <div className="px-6 pt-6 pb-2 shrink-0">
          <TabsList className="w-full bg-secondary/50 p-1 rounded-xl grid grid-cols-2">
            <TabsTrigger
              value="settings"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent
            value="settings"
            className="h-full overflow-y-auto data-[state=active]:block m-0"
          >
            <div className="px-6 py-4 pb-20 space-y-6">
              {/* Prompt */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">
                  Describe the shot
                </Label>
                <Textarea
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="e.g. the influencer turns to camera and smiles while the background stays still"
                  className="bg-secondary/30 border-transparent focus:bg-background min-h-[100px] rounded-2xl resize-none text-sm p-4 transition-all"
                />
                <p className="text-xs text-muted-foreground px-1">
                  Optional. Leave blank to get a faithful motion transfer.
                </p>
              </div>

              {/* Video Duration Info */}
              {videoDuration ? (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Duration Detected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Video length: {videoDuration}s
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Quality / Resolution */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">
                  Quality
                </Label>
                <RadioGroup
                  value={quality}
                  onValueChange={handleQualityChange}
                  className="grid grid-cols-2 gap-3"
                >
                  <label
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                      quality === "720p"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <RadioGroupItem value="720p" className="sr-only" />
                    <span className="text-lg font-bold mb-1">HD</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      720p
                    </span>
                  </label>
                  <label
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                      quality === "1080p"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <RadioGroupItem value="1080p" className="sr-only" />
                    <span className="text-lg font-bold mb-1">Full HD</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      1080p
                    </span>
                  </label>
                </RadioGroup>
              </div>

              {/* Match Mode */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">
                  Match Mode
                </Label>
                <RadioGroup
                  value={matchMode}
                  onValueChange={handleMatchModeChange}
                  className="space-y-3"
                >
                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                      matchMode === "structure"
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                    )}
                  >
                    <RadioGroupItem value="structure" className="mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Structure Match</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Preserves the influencer's framing and composition
                      </p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                      matchMode === "motion"
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                    )}
                  >
                    <RadioGroupItem value="motion" className="mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Motion Match</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Warps the influencer to follow camera movement
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">
                  Format
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "16:9", label: "16:9", desc: "Landscape" },
                    { value: "9:16", label: "9:16", desc: "Portrait" },
                    { value: "1:1", label: "1:1", desc: "Square" },
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => handleAspectRatioChange(ratio.value)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                        aspectRatio === ratio.value
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <span className="text-sm font-bold">{ratio.label}</span>
                      <span className="text-[10px] opacity-70">{ratio.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Strength */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Motion Strength
                  </Label>
                  <span className="text-sm font-mono bg-secondary px-2 py-0.5 rounded-md text-foreground">
                    {motionStrength[0]}%
                  </span>
                </div>
                <div className="px-2">
                  <Slider
                    value={motionStrength}
                    onValueChange={handleMotionStrengthChange}
                    max={100}
                    step={1}
                    className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary [&_[role=slider]]:shadow-md"
                  />
                </div>
              </div>

              {/* Negative Prompt */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">
                  Negative Prompt
                </Label>
                <Textarea
                  value={negativePrompt}
                  onChange={handleNegativePromptChange}
                  placeholder="e.g. blur, distortion, low quality..."
                  className="bg-secondary/30 border-transparent focus:bg-background min-h-[100px] rounded-2xl resize-none text-sm p-4 transition-all"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="results"
            className="h-full overflow-y-auto data-[state=active]:flex flex-col p-4 m-0"
          >
            {isGenerating ? (
              <div className="flex-1 flex flex-col">
                <div className="aspect-video rounded-lg skeleton-shimmer mb-4" />

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                    <span className="text-sm font-medium text-primary">
                      {generationProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span>{generationStatus || "Generating your video..."}</span>
                </div>
              </div>
            ) : result?.status === "completed" && result.result ? (
              <div className="flex-1 flex flex-col">
                <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
                  <video
                    src={result.result.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full"
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-medium">Generation Complete!</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Duration: {result.result.duration}s • Created:{" "}
                    {new Date(result.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {result.model}
                  </p>
                  {transferMode === "frame-reference" && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Motion approximated from sampled frames. Set PUBLIC_URL and
                      expose the server over HTTPS for exact transfer.
                    </p>
                  )}
                  {(creditsUsed !== undefined ||
                    result.result.creditsUsed !== undefined) && (
                    <div className="flex items-center gap-2 text-xs">
                      <Coins className="w-3 h-3 text-amber-500" />
                      <span className="text-muted-foreground">
                        Cost:{" "}
                        <span className="font-medium text-foreground">
                          ${(creditsUsed ?? result.result.creditsUsed)?.toFixed(4)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button variant="secondary" className="flex-1 gap-2" disabled>
                    <Maximize className="w-4 h-4" />
                    Upscale
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">No results yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add an influencer portrait and a performance clip, then click
                    Generate
                  </p>
                  {savedJob && !isGenerating && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4 gap-2"
                      disabled={isRecovering}
                      onClick={onRecover}
                    >
                      <History className="w-4 h-4" />
                      {isRecovering ? "Recovering..." : "Recover last video"}
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button variant="secondary" className="flex-1 gap-2" disabled>
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button variant="secondary" className="flex-1 gap-2" disabled>
                    <Maximize className="w-4 h-4" />
                    Upscale
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};