import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { getPipelineRunStatus, pipelineRunReason } from "@my-project/shared";
import { OctagonX } from "lucide-react";
import { usePipelineRunContext } from "../../providers/PipelineRun/hooks";

export const StopPipelineRunButton = () => {
  const unifiedData = usePipelineRunContext();
  const pipelineRun = unifiedData.pipelineRun;
  const pipelineRunPermissions = usePipelineRunPermissions();
  const { triggerPatchPipelineRun } = usePipelineRunCRUD();

  if (!pipelineRun) {
    return null;
  }

  const status = getPipelineRunStatus(pipelineRun);
  const isInProgress = status.reason === pipelineRunReason.started || status.reason === pipelineRunReason.running;

  // Only show button when pipeline run is in progress
  if (!isInProgress) {
    return null;
  }

  const handleClick = () => {
    if (!pipelineRun) {
      return;
    }

    const newPipelineRun = structuredClone(pipelineRun);
    newPipelineRun.spec.status = "Cancelled";

    triggerPatchPipelineRun({ data: { pipelineRun: newPipelineRun } });
  };

  return (
    <ButtonWithPermission
      ButtonProps={{
        variant: "outline",
        size: "sm",
        onClick: handleClick,
      }}
      allowed={pipelineRunPermissions.data.patch.allowed}
      reason={pipelineRunPermissions.data.patch.reason}
    >
      <OctagonX size={16} /> Stop run
    </ButtonWithPermission>
  );
};
