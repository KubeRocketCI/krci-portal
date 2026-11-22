// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { PrototypeDefectDojoSeverityCounts } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { getSeverityBadgeClasses } from "@/modules/platform/security/constants/severity";
import { PROTOTYPE_NO_VALUE, PROTOTYPE_SEVERITY_KEYS } from "../constants";
import { toSeverityLevel } from "../utils";

export interface SeverityCountsProps {
  /** `null`: no scan data or still loading. Every count renders as a dash, never 0. */
  counts: PrototypeDefectDojoSeverityCounts | null;
  /** `letters`: "C 3". `plain`: the number only, for table cells under a severity header. */
  display?: "letters" | "plain";
  className?: string;
}

/** Active findings per severity as five chips. */
export function SeverityCounts({ counts, display = "letters", className }: SeverityCountsProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {PROTOTYPE_SEVERITY_KEYS.map(({ severity, key, short }) => (
        <SeverityCountChip
          key={key}
          severity={severity}
          count={counts ? counts[key] : null}
          label={display === "letters" ? short : undefined}
        />
      ))}
    </span>
  );
}

/**
 * Active findings as chips of the severities that have findings only, for narrow places.
 * `null` counts render one dash. Counts that are all zero render nothing: the caller shows "Clean".
 */
export function CompactSeverityCounts({ counts, className }: Pick<SeverityCountsProps, "counts" | "className">) {
  if (counts === null) {
    return (
      <span className={cn("text-muted-foreground text-xs", className)} aria-label="No data">
        {PROTOTYPE_NO_VALUE}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {PROTOTYPE_SEVERITY_KEYS.filter(({ key }) => counts[key] > 0).map(({ severity, key, short }) => (
        <SeverityCountChip key={key} severity={severity} count={counts[key]} label={short} />
      ))}
    </span>
  );
}

export interface SeverityCountChipProps {
  severity: string;
  /** `null` renders a dash. */
  count: number | null;
  label?: string;
}

export function SeverityCountChip({ severity, count, label }: SeverityCountChipProps) {
  const text = count === null ? PROTOTYPE_NO_VALUE : String(count);
  const accessibleLabel = count === null ? `${severity}: no data` : `${severity}: ${count}`;

  if (count === null || count === 0) {
    return (
      <span
        aria-label={accessibleLabel}
        className="text-muted-foreground inline-flex min-w-8 items-center justify-center gap-1 rounded-full border px-1.5 py-0.5 text-xs whitespace-nowrap"
      >
        {label && <span aria-hidden>{label}</span>}
        {text}
      </span>
    );
  }

  return (
    <span
      aria-label={accessibleLabel}
      className={cn(
        "inline-flex min-w-8 items-center justify-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        getSeverityBadgeClasses(toSeverityLevel(severity)).combined
      )}
    >
      {label && <span aria-hidden>{label}</span>}
      {text}
    </span>
  );
}
