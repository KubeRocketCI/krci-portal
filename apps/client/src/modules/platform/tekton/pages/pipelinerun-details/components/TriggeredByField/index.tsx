import { TriggeredBy } from "@my-project/shared";
import { UserCheck } from "lucide-react";
import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { AutomationAvatar } from "@/core/components/AutomationAvatar";
import { Tooltip } from "@/core/components/ui/tooltip";

export interface TriggeredByFieldProps {
  /** Classified krci-audit CREATE actor. `undefined` while loading (renders the "N/A" placeholder). */
  triggeredBy: TriggeredBy | undefined;
}

/**
 * PipelineRun header field showing who *triggered* (created) the run — the krci-audit CREATE
 * actor — as opposed to "Author" (the git commit author).
 */
export const TriggeredByField = ({ triggeredBy }: TriggeredByFieldProps) => {
  return (
    <div className="flex items-center gap-2">
      <UserCheck className="text-muted-foreground size-4" />
      <span className="text-muted-foreground text-sm">Triggered By:</span>
      <TriggeredByActor triggeredBy={triggeredBy} />
    </div>
  );
};

const TriggeredByActor = ({ triggeredBy }: TriggeredByFieldProps) => {
  if (!triggeredBy || triggeredBy.actorClass === "unknown") {
    return (
      <Tooltip title="No creator recorded for this run. Ensure krci-audit is enabled and configured properly.">
        <span className="text-muted-foreground text-sm">N/A</span>
      </Tooltip>
    );
  }

  const display = triggeredBy.displayName ?? "";

  if (triggeredBy.actorClass === "automation") {
    return <AutomationAvatar name={display} size="sm" />;
  }

  return <AuthorAvatar author={display} size="sm" />;
};
