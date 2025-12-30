import { Badge, BadgeProps } from "@/core/components/ui/badge";

interface AnalysisStateBadgeProps {
  state: string | undefined;
}

/**
 * Badge component displaying finding analysis state
 */
export function AnalysisStateBadge({ state }: AnalysisStateBadgeProps) {
  if (!state) {
    return <Badge variant="secondary">NOT ANALYZED</Badge>;
  }

  const getVariant = (): BadgeProps["variant"] => {
    switch (state) {
      case "EXPLOITABLE":
        return "destructive";
      case "IN_TRIAGE":
        return "default";
      case "FALSE_POSITIVE":
      case "NOT_AFFECTED":
        return "secondary";
      case "RESOLVED":
        return "outline";
      default:
        return "secondary";
    }
  };

  return <Badge variant={getVariant()}>{state.replace(/_/g, " ")}</Badge>;
}
