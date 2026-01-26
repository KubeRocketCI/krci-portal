import { cn } from "@/core/utils/classname";
import { getSeverityBadgeClasses } from "../../../constants/severity";

export interface SeverityCountBadgeProps {
  /**
   * Count to display
   */
  count: number;
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
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Severity count badge for displaying vulnerability counts in tables
 *
 * Shows count value with severity-appropriate coloring.
 * When count is 0, shows muted "0" text (or badge if showZeroAsBadge is true).
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
export function SeverityCountBadge({ count, severity, showZeroAsBadge = false, className }: SeverityCountBadgeProps) {
  const classes = getSeverityBadgeClasses(severity);

  if (count === 0 && !showZeroAsBadge) {
    return <span className="text-muted-foreground text-sm">0</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
        classes.combined,
        className
      )}
    >
      {count}
    </span>
  );
}
