import { Sparkles, Loader2 } from "lucide-react";
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
  credits = 10 
}: GenerateButtonProps) => {
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end text-right">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Cost</span>
        <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          {credits} credits
        </span>
      </div>

      <Button
        onClick={onClick}
        disabled={disabled || isGenerating}
        className={cn(
          "relative h-14 px-8 text-base font-semibold rounded-2xl overflow-hidden transition-all duration-300 min-w-[280px]",
          "bg-primary text-primary-foreground shadow-xl shadow-primary/20",
          "hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none",
          isGenerating && "cursor-wait"
        )}
      >
        {/* Shimmer effect */}
        {!disabled && !isGenerating && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
        )}
        
        <span className="relative z-10 flex items-center justify-center gap-3">
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 fill-current" />
              <span>Generate Influencer Video</span>
            </>
          )}
        </span>
      </Button>
    </div>
  );
};
