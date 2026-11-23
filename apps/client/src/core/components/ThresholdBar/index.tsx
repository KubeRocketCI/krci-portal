import { cn } from "@/core/utils/classname";

export function ThresholdBar({ pct, className }: { pct: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  const tone = clamped >= 90 ? "bg-status-error" : clamped >= 60 ? "bg-status-missing" : "bg-status-success";

  return (
    <div className={cn("bg-border/40 h-2 w-full overflow-hidden rounded-full", className)}>
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${clamped}%` }} />
    </div>
  );
}
