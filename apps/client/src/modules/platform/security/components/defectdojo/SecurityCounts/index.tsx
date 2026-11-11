import type { SecurityCounts as SecurityCountsData } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { SeverityCountBadge } from "../../shared/SeverityCountBadge";
import { formatCount, SEVERITY_ROWS } from "../utils";

interface SecurityCountsProps {
  counts: SecurityCountsData;
  /** Show the severity name next to each count. */
  showLabels?: boolean;
  className?: string;
}

/** Severity counts of a security summary. Unassigned uses the UNKNOWN severity style. */
export function SecurityCounts({ counts, showLabels = false, className }: SecurityCountsProps) {
  return (
    <ul aria-label="Findings by severity" className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
      {SEVERITY_ROWS.map(({ key, label }) => (
        <li key={key} className="flex items-center gap-1.5" title={`${label}: ${counts[key].toLocaleString("en")}`}>
          <SeverityCountBadge count={counts[key]} displayValue={formatCount(counts[key])} severity={key} />
          <span className={cn(showLabels ? "text-muted-foreground text-xs" : "sr-only")}>{label}</span>
        </li>
      ))}
    </ul>
  );
}
