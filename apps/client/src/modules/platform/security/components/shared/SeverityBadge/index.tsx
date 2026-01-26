import { cn } from "@/core/utils/classname";
import { getSeverityColor, getSeverityBadgeClasses } from "../../../constants/severity";

export interface SeverityBadgeProps {
  /**
   * Severity level (CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN)
   * Case-insensitive
   */
  severity: string;
  /**
   * Optional count to display alongside severity
   */
  count?: number;
  /**
   * Whether to show the count (default: false)
   */
  showCount?: boolean;
  /**
   * Badge variant:
   * - "default": Colored background with text (for standalone badges)
   * - "pill": Compact pill with dot indicator (for inline use)
   * - "dot": Just a colored dot (for minimal display)
   * - "solid": Solid colored background with white text (for high emphasis)
   */
  variant?: "default" | "pill" | "dot" | "solid";
  /**
   * Size variant
   */
  size?: "sm" | "md";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Unified severity badge component for Security module
 *
 * Displays vulnerability severity level with consistent styling across
 * SCA, SAST, and Container Scanning (Trivy) features.
 *
 * @example
 * // Default badge
 * <SeverityBadge severity="CRITICAL" />
 *
 * // With count
 * <SeverityBadge severity="HIGH" count={42} showCount />
 *
 * // Pill variant with dot
 * <SeverityBadge severity="MEDIUM" variant="pill" />
 *
 * // Solid variant (white text on colored background)
 * <SeverityBadge severity="LOW" variant="solid" />
 */
export function SeverityBadge({
  severity,
  count,
  showCount = false,
  variant = "default",
  size = "sm",
  className,
}: SeverityBadgeProps) {
  const normalizedSeverity = severity?.toUpperCase() || "UNKNOWN";
  const displaySeverity = normalizedSeverity === "UNASSIGNED" ? "Unknown" : capitalize(normalizedSeverity);
  const classes = getSeverityBadgeClasses(severity);
  const color = getSeverityColor(severity);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  if (variant === "dot") {
    return (
      <span
        className={cn("inline-block size-2.5 rounded-full", className)}
        style={{ backgroundColor: color }}
        aria-label={displaySeverity}
      />
    );
  }

  if (variant === "solid") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold text-white",
          sizeClasses[size],
          className
        )}
        style={{ backgroundColor: color }}
      >
        {displaySeverity}
        {showCount && count !== undefined && <span className="ml-1">({count})</span>}
      </span>
    );
  }

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          classes.combined,
          sizeClasses[size],
          className
        )}
      >
        <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
        {displaySeverity}
        {showCount && count !== undefined && <span className="font-semibold">({count})</span>}
      </span>
    );
  }

  // Default variant
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        classes.combined,
        sizeClasses[size],
        className
      )}
    >
      {displaySeverity}
      {showCount && count !== undefined && <span className="ml-1 font-semibold">({count})</span>}
    </span>
  );
}

/**
 * Capitalize first letter, lowercase rest
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
