import { useTheme } from "next-themes";
import { NeonOrbs } from "./neon-orbs";
import { EtheralShadow } from "./etheral-shadow";

export const BackgroundEffects = () => {
  const { theme } = useTheme();

  return (
    <>
      {/* Neon Orbs - Only in Light Mode */}
      {theme === 'light' && (
        <NeonOrbs />
      )}
      
      {/* Etheral Shadow Background - Only in Dark Mode */}
      {theme === 'dark' && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <EtheralShadow
            color="rgba(100, 100, 120, 0.9)"
            animation={{ scale: 95, speed: 85 }}
            noise={{ opacity: 1.6, scale: 1.2 }}
            sizing="fill"
            className="opacity-70"
          />
        </div>
      )}
      
      {/* Background Gradients - Only for Dark Mode */}
      {theme === 'dark' && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
        </div>
      )}
    </>
  );
};
