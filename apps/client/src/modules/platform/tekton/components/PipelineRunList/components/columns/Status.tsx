import { StatusIcon } from "@/core/components/StatusIcon";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { getPipelineRunStatusDisplay } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { PipelineRun, getPipelineRunStatus, pipelineRunPhase } from "@my-project/shared";

export const StatusColumn = ({ pipelineRun }: { pipelineRun: PipelineRun }) => {
  const status = getPipelineRunStatus(pipelineRun);
  const statusDisplay = getPipelineRunStatusDisplay(status);

  const errorMessage =
    status.phase === pipelineRunPhase.failed && status.message !== "No message" ? status.message : undefined;

  const badge = (
    <Badge
      className="h-6 max-w-full min-w-0 shrink justify-start"
      style={{ backgroundColor: `${statusDisplay.color}15`, color: statusDisplay.color }}
    >
      <span className="inline-flex shrink-0">
        <StatusIcon
          Icon={statusDisplay.component}
          color={statusDisplay.color}
          isSpinning={statusDisplay.isSpinning}
          width={12}
        />
      </span>
      <span className="min-w-0 flex-1 truncate">{statusDisplay.label}</span>
    </Badge>
  );

  if (!errorMessage) {
    return badge;
  }

  return (
    <Tooltip title={errorMessage} delayDuration={500}>
      {badge}
    </Tooltip>
  );
};
