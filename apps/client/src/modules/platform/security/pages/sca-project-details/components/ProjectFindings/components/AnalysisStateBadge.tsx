import { Badge, type BadgeProps } from "@/core/components/ui/badge";

interface AnalysisStateBadgeProps {
  state: string | undefined;
}

const stateVariants: Record<string, BadgeProps["variant"]> = {
  EXPLOITABLE: "error",
  IN_TRIAGE: "info",
  FALSE_POSITIVE: "success",
  NOT_AFFECTED: "success",
  RESOLVED: "success",
};

/**
 * Badge component displaying finding analysis state
 */
export function AnalysisStateBadge({ state }: AnalysisStateBadgeProps) {
  if (!state) {
    return <Badge variant="neutral">NOT ANALYZED</Badge>;
  }

  return <Badge variant={stateVariants[state] || "neutral"}>{state.replace(/_/g, " ")}</Badge>;
}
