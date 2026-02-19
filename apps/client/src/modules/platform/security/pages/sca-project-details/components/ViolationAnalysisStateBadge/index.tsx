import { Badge, type BadgeProps } from "@/core/components/ui/badge";

interface ViolationAnalysisStateBadgeProps {
  state: string | undefined;
}

const stateVariants: Record<string, BadgeProps["variant"]> = {
  APPROVED: "success",
  REJECTED: "error",
  NOT_SET: "neutral",
};

/**
 * Badge component displaying policy violation analysis state (APPROVED, REJECTED, etc.)
 */
export function ViolationAnalysisStateBadge({ state }: ViolationAnalysisStateBadgeProps) {
  if (!state) {
    return <Badge variant="neutral">NOT SET</Badge>;
  }

  return <Badge variant={stateVariants[state] || "neutral"}>{state.replace(/_/g, " ")}</Badge>;
}
