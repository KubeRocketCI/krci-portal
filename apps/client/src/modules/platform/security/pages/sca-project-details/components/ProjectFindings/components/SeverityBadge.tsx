import { Badge } from "@/core/components/ui/badge";
import { getSeverityColor } from "../../../../sca/constants/colors";

interface SeverityBadgeProps {
  severity: string | undefined;
}

/**
 * Badge component displaying vulnerability severity with appropriate color
 */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const color = getSeverityColor(severity);
  const displaySeverity = severity || "UNASSIGNED";

  return (
    <Badge
      className="font-semibold text-white"
      style={{
        backgroundColor: color,
        borderColor: color,
      }}
    >
      {displaySeverity}
    </Badge>
  );
}
