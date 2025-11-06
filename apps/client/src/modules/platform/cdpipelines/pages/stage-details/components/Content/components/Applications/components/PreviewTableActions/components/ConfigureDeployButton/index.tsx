import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { usePageUIStore } from "@/modules/platform/cdpipelines/pages/stage-details/store";
import { Pencil } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

export const ConfigureDeployButton = ({
  latestCleanPipelineRunIsRunning,
  latestDeployPipelineRunIsRunning,
  toggleMode,
}: {
  latestCleanPipelineRunIsRunning: boolean;
  latestDeployPipelineRunIsRunning: boolean;
  toggleMode: () => void;
}) => {
  const { deployBtnDisabled } = usePageUIStore(
    useShallow((state) => ({
      deployBtnDisabled: state.deployBtnDisabled,
    }))
  );

  const pipelineRunPermissions = usePipelineRunPermissions();

  return (
    <ButtonWithPermission
      ButtonProps={{
        variant: "default",
        onClick: toggleMode,
        disabled: latestDeployPipelineRunIsRunning || latestCleanPipelineRunIsRunning || deployBtnDisabled,
      }}
      allowed={pipelineRunPermissions.data?.create.allowed}
      reason={pipelineRunPermissions.data?.create.reason}
    >
      {deployBtnDisabled || latestDeployPipelineRunIsRunning ? <LoadingSpinner size={16} /> : <Pencil size={16} />}
      {deployBtnDisabled || latestDeployPipelineRunIsRunning ? "Deploying" : "Configure Deploy"}
    </ButtonWithPermission>
  );
};
