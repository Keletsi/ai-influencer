import { Sparkles, Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenerateButtonProps {
  onClick?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  credits?: number;
}

export const GenerateButton = ({
  onClick,
  isGenerating = false,
  disabled = false,
  credits = 10,
}: GenerateButtonProps) => {
  return (
    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 sm:justify-start sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Estimated cost
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Coins className="h-3.5 w-3.5 text-primary" />
          {credits} credits
        </span>
      </div>

      <Button
        onClick={onClick}
        disabled={disabled || isGenerating}
        size="lg"
        className={cn(
          "h-12 w-full gap-2.5 rounded-lg px-6 text-sm font-semibold sm:w-auto sm:min-w-[220px]",
          isGenerating && "cursor-wait"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate video
          </>
        )}
      </Button>
    </div>
  );
};
