import { cn } from "@/core/utils/classname";
import { getSeverityBadgeClasses } from "../../../constants/severity";

export interface SeverityCountBadgeProps {
  /**
   * Count to display. `null`: there is no count, shown as a dash and never as 0.
   */
  count: number | null;
  /**
   * Severity level (critical, high, medium, low, unknown)
   * Case-insensitive
   */
  severity: string;
  /**
   * Whether to show 0 as a badge or as plain text
   * @default false (shows "0" as muted text when count is 0)
   */
  showZeroAsBadge?: boolean;
  /**
   * Accessible name of the count, for places where the severity is not named by a column header.
   * Without it the badge adds no name of its own.
   */
  ariaLabel?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Severity count badge for displaying vulnerability counts in tables
 *
 * Shows count value with severity-appropriate coloring.
 * When count is 0, shows muted "0" text (or badge if showZeroAsBadge is true). When count is null, shows a muted dash.
 *
 * @example
 * // In a table column
 * <SeverityCountBadge count={42} severity="critical" />
 *
 * // Shows "0" as muted text
 * <SeverityCountBadge count={0} severity="high" />
 *
 * // Shows 0 as a badge
 * <SeverityCountBadge count={0} severity="medium" showZeroAsBadge />
 */
export function SeverityCountBadge({
  count,
  severity,
  showZeroAsBadge = false,
  ariaLabel,
  className,
}: SeverityCountBadgeProps) {
  const classes = getSeverityBadgeClasses(severity);
  const name = ariaLabel ? ({ role: "img", "aria-label": ariaLabel } as const) : {};

  if (count === null || (count === 0 && !showZeroAsBadge)) {
    return (
      <span {...name} className="text-muted-foreground shrink-0 text-sm whitespace-nowrap">
        {count === null ? "—" : 0}
      </span>
    );
  }

  return (
    <span
      {...name}
      className={cn(
        "inline-flex min-w-[2rem] shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        classes.combined,
        className
      )}
    >
      {count}
    </span>
  );
}
