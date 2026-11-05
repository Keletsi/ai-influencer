import { useState } from "react";
import {
  Settings,
  Download,
  CheckCircle2,
  Coins,
  History,
  Film,
  AlertCircle,
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
  generationStatus = "",
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

  const fieldLabel = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <aside className="rounded-xl border border-border bg-card">
      <Tabs defaultValue="settings" className="flex flex-col">
        <div className="border-b border-border px-4 py-3">
          <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
            <TabsTrigger
              value="settings"
              className="gap-1.5 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="gap-1.5 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Film className="h-3.5 w-3.5" />
              Results
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="m-0">
          <div className="space-y-7 px-5 py-5">
            {/* Prompt */}
            <div className="space-y-2">
              <Label className={fieldLabel}>Describe the shot</Label>
              <Textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder="e.g. the influencer turns to camera and smiles while the background stays still"
                className="min-h-[92px] resize-none rounded-lg border-border bg-background text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Leave blank for a faithful performance transfer.
              </p>
            </div>

            {/* Detected duration */}
            {videoDuration ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-secondary px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Duration detected
                  </p>
                  <p className="text-xs text-secondary-foreground">
                    Clip length: {videoDuration}s
                  </p>
                </div>
              </div>
            ) : null}

            {/* Quality */}
            <div className="space-y-3">
              <Label className={fieldLabel}>Resolution</Label>
              <RadioGroup
                value={quality}
                onValueChange={handleQualityChange}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: "720p", title: "HD", sub: "720p" },
                  { value: "1080p", title: "Full HD", sub: "1080p" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-lg border px-3 py-3 transition-colors",
                      quality === option.value
                        ? "border-primary bg-secondary"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <span className="text-sm font-semibold text-foreground">
                      {option.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.sub}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Match mode */}
            <div className="space-y-3">
              <Label className={fieldLabel}>Match mode</Label>
              <RadioGroup
                value={matchMode}
                onValueChange={handleMatchModeChange}
                className="space-y-2"
              >
                {[
                  {
                    value: "structure",
                    title: "Structure match",
                    description: "Keeps the portrait's framing and composition",
                  },
                  {
                    value: "motion",
                    title: "Motion match",
                    description: "Follows the full body movement and camera path",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      matchMode === option.value
                        ? "border-primary bg-secondary"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    <RadioGroupItem value={option.value} className="mt-0.5" />
                    <span className="space-y-0.5">
                      <span className="block text-sm font-medium text-foreground">
                        {option.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Aspect ratio */}
            <div className="space-y-3">
              <Label className={fieldLabel}>Format</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "9:16", label: "9:16", desc: "Portrait" },
                  { value: "16:9", label: "16:9", desc: "Landscape" },
                  { value: "1:1", label: "1:1", desc: "Square" },
                ].map((ratio) => (
                  <button
                    key={ratio.value}
                    type="button"
                    onClick={() => handleAspectRatioChange(ratio.value)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border px-2 py-2.5 transition-colors",
                      aspectRatio === ratio.value
                        ? "border-primary bg-secondary text-secondary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <span className="text-sm font-semibold">{ratio.label}</span>
                    <span className="text-[10px] uppercase tracking-wide">
                      {ratio.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Motion strength */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className={fieldLabel}>Motion strength</Label>
                <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                  {motionStrength[0]}%
                </span>
              </div>
              <Slider
                value={motionStrength}
                onValueChange={handleMotionStrengthChange}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Higher values copy the performance more aggressively.
              </p>
            </div>

            {/* Negative prompt */}
            <div className="space-y-2">
              <Label className={fieldLabel}>Negative prompt</Label>
              <Textarea
                value={negativePrompt}
                onChange={handleNegativePromptChange}
                placeholder="e.g. blur, distortion, low quality..."
                className="min-h-[80px] resize-none rounded-lg border-border bg-background text-sm"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="m-0">
          <div className="flex flex-col gap-4 px-5 py-5">
            {isGenerating ? (
              <div className="flex flex-col gap-4">
                <div className="skeleton-shimmer aspect-video w-full rounded-lg" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Rendering</span>
                    <span className="font-mono text-primary">
                      {generationProgress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {generationStatus || "Generating your video..."}
                  </p>
                </div>
              </div>
            ) : result?.status === "completed" && result.result ? (
              <div className="flex flex-col gap-4">
                <div className="aspect-video overflow-hidden rounded-lg border border-border bg-foreground">
                  <video
                    src={result.result.videoUrl}
                    controls
                    playsInline
                    className="h-full w-full"
                  />
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Generation complete
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.result.duration}s •{" "}
                    {new Date(result.createdAt).toLocaleString()}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {result.model}
                  </p>

                  {transferMode === "frame-reference" && (
                    <p className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                      Motion approximated from sampled frames. Set PUBLIC_URL and
                      serve over HTTPS for exact transfer.
                    </p>
                  )}

                  {(creditsUsed !== undefined ||
                    result.result.creditsUsed !== undefined) && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Coins className="h-3 w-3 text-primary" />
                      Cost:{" "}
                      <span className="font-medium text-foreground">
                        ${(creditsUsed ?? result.result.creditsUsed)?.toFixed(4)}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ) : result?.status === "failed" ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm font-medium text-foreground">
                  Generation failed
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {result.error || "OpenRouter did not return a video."}
                </p>
                {savedJob && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    disabled={isRecovering}
                    onClick={onRecover}
                  >
                    <History className="h-3.5 w-3.5" />
                    {isRecovering ? "Recovering..." : "Recover last video"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <Film className="h-6 w-6 text-primary" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  No render yet
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Add a portrait and a performance clip, then press Generate.
                </p>
                {savedJob && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    disabled={isRecovering}
                    onClick={onRecover}
                  >
                    <History className="h-3.5 w-3.5" />
                    {isRecovering ? "Recovering..." : "Recover last video"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
};
