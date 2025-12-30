import { Badge } from "@/core/components/ui/badge";
import { VIOLATION_COLORS } from "../../../sca/constants/colors";

interface ViolationStateBadgeProps {
  state: string;
}

/**
 * Badge component displaying policy violation state (FAIL, WARN, INFO)
 */
export function ViolationStateBadge({ state }: ViolationStateBadgeProps) {
  const getColor = () => {
    switch (state) {
      case "FAIL":
        return VIOLATION_COLORS.FAIL;
      case "WARN":
        return VIOLATION_COLORS.WARN;
      case "INFO":
        return VIOLATION_COLORS.INFO;
      default:
        return VIOLATION_COLORS.INFO;
    }
  };

  return (
    <Badge className="font-semibold text-white" style={{ backgroundColor: getColor(), borderColor: getColor() }}>
      {state}
    </Badge>
  );
}
