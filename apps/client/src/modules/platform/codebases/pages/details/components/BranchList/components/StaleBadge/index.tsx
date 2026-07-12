import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { checkIsStaleBranch, getStaleCondition } from "@my-project/shared";
import { StaleBadgeProps } from "./types";

export function StaleBadge({ codebaseBranch }: StaleBadgeProps) {
  const staleCondition = getStaleCondition(codebaseBranch);

  if (!checkIsStaleBranch(codebaseBranch, staleCondition)) {
    return null;
  }

  return (
    <Tooltip title={staleCondition?.message ?? "Branch was not found in the git repository"}>
      <Badge variant="warning" className="h-5 text-xs">
        Stale
      </Badge>
    </Tooltip>
  );
}
