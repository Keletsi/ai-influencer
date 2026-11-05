import { Clapperboard, Github } from "lucide-react";

/**
 * Site footer. Deliberately quiet: one row of brand/legal, one row of links.
 */
export const AppFooter = () => {
  return (
    <footer className="mt-16 border-t border-border bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Clapperboard className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                AI-influencer
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Turn a portrait and a performance clip into a creator-ready video.
              Bring your own OpenRouter key - your renders stay in your browser.
            </p>
          </div>

          <div className="flex gap-12 sm:gap-16">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Product
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-primary">
                    Studio
                  </a>
                </li>
                <li>
                  <a href="#recent-renders" className="hover:text-primary">
                    Recent renders
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-primary">
                    How it works
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Resources
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    Get an API key
                  </a>
                </li>
                <li>
                  <a
                    href="https://openrouter.ai/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    OpenRouter docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Keletsi/ai-influencer"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-primary"
                  >
                    <Github className="h-3.5 w-3.5" />
                    Source
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AI-influencer. All rights reserved.</p>
          <p>
            Video generation is powered by OpenRouter. Use only footage you have
            the rights to.
          </p>
        </div>
      </div>
    </footer>
  );
};
