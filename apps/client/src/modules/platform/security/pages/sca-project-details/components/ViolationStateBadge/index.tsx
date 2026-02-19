import { Badge, type BadgeProps } from "@/core/components/ui/badge";

interface ViolationStateBadgeProps {
  state: string;
}

const stateVariants: Record<string, BadgeProps["variant"]> = {
  FAIL: "error",
  WARN: "warning",
  INFO: "info",
};

/**
 * Badge component displaying policy violation state (FAIL, WARN, INFO)
 */
export function ViolationStateBadge({ state }: ViolationStateBadgeProps) {
  return (
    <Badge variant={stateVariants[state] || "info"} className="font-semibold">
      {state}
    </Badge>
  );
}
