import { Loader2 } from "lucide-react";

import { cn } from "@/core/utils/classname";

interface LoadingStateProps {
  className?: string;
  message?: string;
}

export function LoadingState({ className, message = "Loading..." }: LoadingStateProps) {
  return (
    <div className={cn("flex items-center justify-center py-6", className)}>
      <Loader2 className="text-muted-foreground size-5 animate-spin" />
      <span className="text-muted-foreground ml-2 text-sm">{message}</span>
    </div>
  );
}
