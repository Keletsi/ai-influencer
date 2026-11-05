import { Clapperboard, KeyRound, Settings2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  keyConfigured: boolean;
  keySource?: "byok" | "server" | "none";
  onOpenSettings: () => void;
}

/**
 * Site header: brand, section links, BYOK status and the settings entry point.
 * Flat white surface, blue accents only - no blur, glow or gradient.
 */
export const AppHeader = ({
  keyConfigured,
  keySource = "none",
  onOpenSettings,
}: AppHeaderProps) => {
  const statusLabel = keyConfigured
    ? keySource === "byok"
      ? "Your key"
      : "Server key"
    : "No API key";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Clapperboard className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            AI-influencer
          </span>
        </a>

        {/* Section links */}
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Studio
          </a>
          <a
            href="#recent-renders"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Recent renders
          </a>
          <a
            href="#how-it-works"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            How it works
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* BYOK status */}
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium sm:inline-flex",
              keyConfigured
                ? "border-primary/20 bg-secondary text-secondary-foreground"
                : "border-amber-300 bg-amber-50 text-amber-800"
            )}
            title={
              keyConfigured
                ? keySource === "byok"
                  ? "Using the OpenRouter key stored in this browser"
                  : "Using the OpenRouter key configured on the server"
                : "Add your OpenRouter key to start generating"
            }
          >
            {keyConfigured ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            {statusLabel}
          </span>

          <Button
            variant={keyConfigured ? "outline" : "default"}
            size="sm"
            onClick={onOpenSettings}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sr-only sm:hidden">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
