import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home, ShieldOff } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";

function Forbidden() {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
        <ShieldOff className="text-muted-foreground h-10 w-10" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-3xl font-bold">Access denied</h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          You don&apos;t have permission to view this page.
        </p>
      </div>

      <Badge variant="neutral" className="font-mono">
        403 &middot; Forbidden
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

export default Forbidden;
