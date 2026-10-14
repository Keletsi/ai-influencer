import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BackgroundEffects } from "@/components/ui/background-effects";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <BackgroundEffects />
      <div className="text-center relative z-10">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          This creator page doesn't exist
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Back to the studio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
