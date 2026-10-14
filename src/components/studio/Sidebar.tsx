import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Sidebar = () => {
  return (
    <aside className="flex flex-col items-center w-20 py-8 h-full bg-background/80 backdrop-blur-xl border-r border-border/50">
      {/* Logo */}
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-4 flex-1 pt-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Sparkles className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-popover/80 backdrop-blur-md border-border/50 text-sm font-medium"
          >
            Create
          </TooltipContent>
        </Tooltip>
      </nav>

      {/* Theme Toggle */}
      <div className="mt-auto flex flex-col items-center gap-6">
        <ThemeToggle />
      </div>
    </aside>
  );
};