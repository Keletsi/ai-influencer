import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Clapperboard className="h-6 w-6 text-primary-foreground" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find <code className="font-mono">{location.pathname}</code>.
        </p>
        <Button className="mt-6" asChild>
          <a href="/">Back to the studio</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
