import { SEVERITY_COLORS } from "@/modules/platform/security/constants/severity";

interface SeverityBadgeProps {
  value: number;
  label: string;
  severity: "critical" | "high" | "medium" | "low" | "unassigned";
}

/**
 * Severity badge for DependencyTrack metrics
 * Displays a count with colored indicator dot
 */
export function SeverityBadge({ value, label, severity }: SeverityBadgeProps) {
  const colorMap = {
    critical: SEVERITY_COLORS.CRITICAL,
    high: SEVERITY_COLORS.HIGH,
    medium: SEVERITY_COLORS.MEDIUM,
    low: SEVERITY_COLORS.LOW,
    unassigned: SEVERITY_COLORS.UNASSIGNED,
  };

  const color = colorMap[severity];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        {/* Colored indicator dot */}
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />

        {/* Value */}
        <span className="text-foreground text-xl font-semibold">{value}</span>
      </div>

      {/* Label */}
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
