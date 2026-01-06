import { Badge } from "@/core/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { QUALITY_GATE_COLORS } from "../../constants";

interface QualityGateBadgeProps {
  status?: string;
  className?: string;
}

type QualityGateStatus = "OK" | "WARN" | "ERROR" | "NONE";

/**
 * Badge component to display SonarQube Quality Gate status
 */
export function QualityGateBadge({ status, className }: QualityGateBadgeProps) {
  const getStatusConfig = () => {
    const normalizedStatus = (status || "NONE") as QualityGateStatus;
    const colors = QUALITY_GATE_COLORS[normalizedStatus] || QUALITY_GATE_COLORS.NONE;

    switch (normalizedStatus) {
      case "OK":
        return {
          label: "Passed",
          icon: CheckCircle2,
          bgClass: `${colors.combined} ${colors.border}`,
        };
      case "WARN":
        return {
          label: "Warning",
          icon: AlertTriangle,
          bgClass: `${colors.combined} ${colors.border}`,
        };
      case "ERROR":
        return {
          label: "Failed",
          icon: XCircle,
          bgClass: `${colors.combined} ${colors.border}`,
        };
      default:
        return {
          label: "N/A",
          icon: HelpCircle,
          bgClass: `${colors.combined} ${colors.border}`,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", config.bgClass, className)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
