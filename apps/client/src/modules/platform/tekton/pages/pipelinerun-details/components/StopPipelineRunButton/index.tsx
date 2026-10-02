import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useStopPipelineRuns } from "@/modules/platform/tekton/hooks/useStopPipelineRuns";
import { isPipelineRunStoppable } from "@my-project/shared";
import { OctagonX } from "lucide-react";
import { usePipelineRunContext } from "../../providers/PipelineRun/hooks";

export const StopPipelineRunButton = () => {
  const { pipelineRun } = usePipelineRunContext();
  const { stop, isPending, permission } = useStopPipelineRuns();

  if (!pipelineRun || !isPipelineRunStoppable(pipelineRun)) {
    return null;
  }

  return (
    <ButtonWithPermission
      ButtonProps={{
        variant: "outline",
        size: "sm",
        onClick: () => void stop([pipelineRun]),
        disabled: isPending,
      }}
      allowed={permission.allowed}
      reason={permission.reason}
    >
      <OctagonX size={16} /> Stop run
    </ButtonWithPermission>
  );
};
