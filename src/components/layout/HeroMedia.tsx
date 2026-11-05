import { useEffect, useState } from "react";

/**
 * How long to wait before wiring up the banner videos.
 *
 * Delaying the video mounts keeps the hero's first paint cheap: the poster
 * images sell the banner on their own, fonts/indexing/first paint land first,
 * and then the loops fade in on top.
 */
const MEDIA_IDLE_MS = 1200;

function useEnhancedMedia(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;

    // Respect OS-level reduced motion: those visitors get the static poster,
    // never a moving banner.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (still.matches) return;

    const idle = window.setTimeout(() => setEnabled(true), MEDIA_IDLE_MS);

    const onStill = (event: MediaQueryListEvent) => {
      if (event.matches) setEnabled(false);
    };
    still.addEventListener("change", onStill);

    return () => {
      window.clearTimeout(idle);
      still.removeEventListener("change", onStill);
    };
  }, []);

  return enabled;
}

/**
 * Hero backdrop: the Wan 3.0 Prime render as a quiet, on-brand texture.
 *
 * The clip is played greyscale at low opacity over a blue panel, so even a
 * colour AI render reads as blue-and-white material rather than a colour
 * break. It sits behind a white scrim so the headline stays untouched.
 */
export const HeroBackdrop = () => {
  const motionOk = useEnhancedMedia();

  return (
    <div className="absolute inset-0 z-0" aria-hidden="true">
      {/* Static base - always rendered, so it works before React effects run */}
      <img
        src="/banner/wan-hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale mix-blend-multiply"
      />

      {motionOk && (
        <video
          src="/banner/wan-hero.mp4"
          poster="/banner/wan-hero.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale mix-blend-multiply"
        />
      )}

      {/* Readability scrim: white wash over the media, stronger on the left
          where the headline lives. Without it the text would fight the video. */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
    </div>
  );
};

const SOURCE_LABELS = [
  { src: "/banner/wan-hero.mp4", poster: "/banner/wan-hero.jpg", label: "Alibaba Wan 3.0 Prime" },
  { src: "/banner/hailuo-sample.mp4", poster: "/banner/hailuo-sample.jpg", label: "MiniMax Hailuo 3 Max" },
];

/**
 * Hero showcase card: the portrait Hailuo render in a contained frame that
 * advertises the exact model behind it (paired with a thumbnail of the Wan
 * clip). Both layers are lazy-mounted so the card adds nothing to first paint
 * until the viewport is ~1 MB of video behind on bandwidth.
 */
export const SampleShowcase = () => {
  const motionOk = useEnhancedMedia();

  return (
    <figure className="relative w-full max-w-sm justify-self-center lg:max-w-[300px]">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {motionOk ? (
          <video
            src={SOURCE_LABELS[1].src}
            poster={SOURCE_LABELS[1].poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="aspect-[9/16] h-full w-full object-cover"
          />
        ) : (
          <img
            src={SOURCE_LABELS[1].poster}
            alt="Example AI influencer render"
            className="aspect-[9/16] h-full w-full object-cover"
          />
        )}
      </div>

      <figcaption className="mt-3 space-y-2">
        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-secondary-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Rendered with {SOURCE_LABELS[1].label}
        </p>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          Also supported: {SOURCE_LABELS[0].label}
        </p>
      </figcaption>
    </figure>
  );
};
