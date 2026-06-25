import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";

function NotFound() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
        <Compass className="text-muted-foreground h-10 w-10" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          There&apos;s nothing at this address. The page may have moved, or the link is incomplete.
        </p>
      </div>

      <Badge variant="neutral" className="font-mono">
        404 &middot; {pathname}
      </Badge>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/home">
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => (router.history.canGoBack() ? router.history.back() : router.navigate({ to: "/home" }))}
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
