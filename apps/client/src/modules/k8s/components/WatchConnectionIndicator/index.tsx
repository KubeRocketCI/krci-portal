import { cn } from "@/core/utils/classname";

export type WatchStatus = "connected" | "reconnecting" | "error";

export function WatchConnectionIndicator({ status }: { status: WatchStatus }) {
  const tone = status === "connected" ? "bg-emerald-500" : status === "reconnecting" ? "bg-amber-500" : "bg-red-500";
  const label = status === "connected" ? "Live" : status === "reconnecting" ? "Reconnecting" : "Error";
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs" role="status" aria-live="polite">
      <span className={cn("h-2 w-2 rounded-full", tone)} aria-hidden />
      {label}
    </span>
  );
}
