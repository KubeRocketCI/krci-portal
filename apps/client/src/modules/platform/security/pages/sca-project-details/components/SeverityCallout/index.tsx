import { SEVERITY_COLORS, SEVERITY_BG_COLORS, RISK_SCORE_COLORS } from "../../../sca/constants/colors";

interface SeverityCalloutProps {
  severity: "critical" | "high" | "medium" | "low" | "unassigned" | "riskScore";
  label: string;
  value: number;
}

export function SeverityCallout({ severity, label, value }: SeverityCalloutProps) {
  const colorMap = {
    critical: {
      bg: SEVERITY_BG_COLORS.CRITICAL,
      border: SEVERITY_COLORS.CRITICAL,
    },
    high: {
      bg: SEVERITY_BG_COLORS.HIGH,
      border: SEVERITY_COLORS.HIGH,
    },
    medium: {
      bg: SEVERITY_BG_COLORS.MEDIUM,
      border: SEVERITY_COLORS.MEDIUM,
    },
    low: {
      bg: SEVERITY_BG_COLORS.LOW,
      border: SEVERITY_COLORS.LOW,
    },
    unassigned: {
      bg: SEVERITY_BG_COLORS.UNASSIGNED,
      border: SEVERITY_COLORS.UNASSIGNED,
    },
    riskScore: {
      bg: RISK_SCORE_COLORS.BACKGROUND,
      border: RISK_SCORE_COLORS.BORDER,
    },
  };

  const colors = colorMap[severity];

  return (
    <div
      className="rounded-lg border-l-4 p-3"
      style={{
        backgroundColor: colors.bg,
        borderLeftColor: colors.border,
      }}
    >
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-2xl font-bold">{severity === "riskScore" ? value.toFixed(1) : value}</div>
    </div>
  );
}
