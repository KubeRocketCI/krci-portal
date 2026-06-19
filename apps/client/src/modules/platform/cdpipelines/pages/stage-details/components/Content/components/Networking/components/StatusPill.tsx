import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import type { NetCondition } from "../types";
import { conditionColor } from "../utils";

interface StatusPillProps {
  condition: NetCondition;
  label?: string;
  /** resource.metadata.generation for stale-status check */
  resourceGeneration?: number;
}

export function StatusPill({ condition, label, resourceGeneration }: StatusPillProps) {
  const isStale =
    resourceGeneration !== undefined &&
    condition.observedGeneration !== undefined &&
    condition.observedGeneration < resourceGeneration;

  const color = isStale ? "amber" : conditionColor(condition.status, condition.reason);

  const dot = color === "green" ? "●" : color === "amber" ? "○" : "✗";

  const colorClass =
    color === "green"
      ? "text-green-600 border-green-500/40 bg-green-500/10"
      : color === "amber"
        ? "text-amber-600 border-amber-500/40 bg-amber-500/10"
        : "text-destructive border-destructive/40 bg-destructive/10";

  const displayLabel = label ?? condition.type;
  const tooltipTitle = isStale
    ? `Status may be stale — controller has not reconciled generation ${resourceGeneration} yet.`
    : (condition.message ?? condition.reason ?? condition.type);

  return (
    <Tooltip title={tooltipTitle}>
      <span
        className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", colorClass)}
      >
        <span aria-hidden>{dot}</span>
        {displayLabel}
        {condition.reason && condition.reason !== condition.type && (
          <span className="text-[10px] opacity-70">({condition.reason})</span>
        )}
      </span>
    </Tooltip>
  );
}
