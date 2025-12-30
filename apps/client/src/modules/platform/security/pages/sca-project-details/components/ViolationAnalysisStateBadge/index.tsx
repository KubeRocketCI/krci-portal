import { Badge, BadgeProps } from "@/core/components/ui/badge";

interface ViolationAnalysisStateBadgeProps {
  state: string | undefined;
}

/**
 * Badge component displaying policy violation analysis state (APPROVED, REJECTED, etc.)
 */
export function ViolationAnalysisStateBadge({ state }: ViolationAnalysisStateBadgeProps) {
  if (!state) {
    return <Badge variant="secondary">NOT SET</Badge>;
  }

  const getVariant = (): BadgeProps["variant"] => {
    switch (state) {
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "NOT_SET":
        return "outline";
      default:
        return "secondary";
    }
  };

  return <Badge variant={getVariant()}>{state.replace(/_/g, " ")}</Badge>;
}
