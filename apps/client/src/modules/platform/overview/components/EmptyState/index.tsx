import { cn } from "@/core/utils/classname";

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return <p className={cn("text-muted-foreground py-6 text-center text-sm", className)}>{message}</p>;
}
