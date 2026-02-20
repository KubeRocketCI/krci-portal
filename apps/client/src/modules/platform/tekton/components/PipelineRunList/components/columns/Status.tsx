import { StatusIcon } from "@/core/components/StatusIcon";
import { Badge } from "@/core/components/ui/badge";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { PipelineRun, getPipelineRunStatus } from "@my-project/shared";

export const StatusColumn = ({ pipelineRun }: { pipelineRun: PipelineRun }) => {
  const statusIcon = getPipelineRunStatusIcon(pipelineRun);
  const status = getPipelineRunStatus(pipelineRun);

  return (
    <Badge className="h-6" style={{ backgroundColor: `${statusIcon.color}15`, color: statusIcon.color }}>
      <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} width={12} />
      <span className="capitalize">{status.reason}</span>
    </Badge>
  );
};
