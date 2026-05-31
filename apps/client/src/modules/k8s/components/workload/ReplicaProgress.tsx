import { cn } from "@/core/utils/classname";

interface ReplicaProgressProps {
  ready: number;
  desired: number;
  className?: string;
}

/**
 * A compact `ready / desired` count with a colored ratio bar.
 * Green when fully satisfied, blue (in-progress) otherwise.
 */
export function ReplicaProgress({ ready, desired, className }: ReplicaProgressProps) {
  const pct = desired > 0 ? Math.min(100, Math.round((ready / desired) * 100)) : ready > 0 ? 100 : 0;
  const complete = desired > 0 && ready >= desired;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-sm font-medium tabular-nums">
        {ready} / {desired}
      </span>
      <div className="bg-border/40 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", complete ? "bg-status-success" : "bg-status-in-progress")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
