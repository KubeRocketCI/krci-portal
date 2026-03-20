import { StatusIcon } from "@/core/components/StatusIcon";
import { Badge } from "@/core/components/ui/badge";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { PipelineRun, getPipelineRunStatus } from "@my-project/shared";

export const StatusColumn = ({ pipelineRun }: { pipelineRun: PipelineRun }) => {
  const statusIcon = getPipelineRunStatusIcon(pipelineRun);
  const status = getPipelineRunStatus(pipelineRun);

  return (
    <Badge
      className="h-6 max-w-full min-w-0 shrink justify-start"
      style={{ backgroundColor: `${statusIcon.color}15`, color: statusIcon.color }}
    >
      <span className="inline-flex shrink-0">
        <StatusIcon
          Icon={statusIcon.component}
          color={statusIcon.color}
          isSpinning={statusIcon.isSpinning}
          width={12}
        />
      </span>
      <span className="min-w-0 flex-1 truncate capitalize">{status.reason}</span>
    </Badge>
  );
};
