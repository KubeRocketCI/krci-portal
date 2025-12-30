import { SEVERITY_COLORS } from "../../../sca/constants/colors";

interface SeverityPieChartProps {
  value: number;
  severity: "critical" | "high" | "medium" | "low" | "unassigned";
  label: string;
}

export function SeverityPieChart({ value, severity, label }: SeverityPieChartProps) {
  const colorMap = {
    critical: SEVERITY_COLORS.CRITICAL,
    high: SEVERITY_COLORS.HIGH,
    medium: SEVERITY_COLORS.MEDIUM,
    low: SEVERITY_COLORS.LOW,
    unassigned: SEVERITY_COLORS.UNASSIGNED,
  };

  const color = colorMap[severity];
  const size = 50;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center" title={label}>
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Foreground circle (100% filled) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 transform"
          style={{
            fontSize: "14px",
            fontWeight: "600",
            fill: "hsl(var(--foreground))",
            transformOrigin: "center",
          }}
        >
          {value}
        </text>
      </svg>
    </div>
  );
}
