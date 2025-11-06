import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export interface CriticalErrorProps {
  title?: string;
  message?: string;
  error?: Error | { message?: string; name?: string };
  onRetry?: () => void;
  onGoHome?: () => void;
  showActions?: boolean;
}

export function CriticalError({
  title = "Critical Error",
  message,
  error,
  onRetry,
  onGoHome,
  showActions = true,
}: CriticalErrorProps) {
  const errorMessage = message || error?.message || "An unexpected error occurred";
  const errorName = error?.name;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div className="z-10 mx-auto w-full max-w-2xl rounded-lg bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:bg-gray-900/95">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            {errorName && <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{errorName}</p>}
          </div>

          <Alert variant="destructive" className="w-full text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2 wrap-break-word whitespace-pre-wrap">{errorMessage}</AlertDescription>
          </Alert>

          {error && "stack" in error && error.stack && (
            <details className="w-full text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                Technical Details
              </summary>
              <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-gray-100 p-4 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {error.stack}
              </pre>
            </details>
          )}

          {showActions && (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {onRetry && (
                <Button onClick={handleRetry} variant="default" className="min-w-[140px]">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              )}
              <Button onClick={handleGoHome} variant="outline" className="min-w-[140px]">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
