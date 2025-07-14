import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConfirmDialog } from "@/core/components/Confirm";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { usePipelineRunPermissions, usePipelineRunCRUD } from "@/core/k8s/api/groups/Tekton/PipelineRun";
import { useRequestStatusMessages } from "@/core/k8s/api/hooks/useResourceRequestStatusMessages";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import {
  useCDPipelineWatch,
  useCleanPipelineRunTemplateWatch,
  useStageWatch,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { k8sOperation, createCleanPipelineRunDraft } from "@my-project/shared";
import { Trash } from "lucide-react";
import React from "react";

export const CleanButton = ({
  latestCleanPipelineRunIsRunning,
  latestDeployPipelineRunIsRunning,
}: {
  latestCleanPipelineRunIsRunning: boolean;
  latestDeployPipelineRunIsRunning: boolean;
}) => {
  const cleanPipelineRunTemplateWatch = useCleanPipelineRunTemplateWatch();
  const cdPipelineWatch = useCDPipelineWatch();
  const stageWatch = useStageWatch();

  const pipelineRunPermissions = usePipelineRunPermissions();

  const cleanPipelineRunTemplate = cleanPipelineRunTemplateWatch.data;
  const cdPipeline = cdPipelineWatch.query.data;
  const stage = stageWatch.query.data;

  const { showRequestErrorMessage } = useRequestStatusMessages();
  const { triggerCreatePipelineRun } = usePipelineRunCRUD();
  const openConfirmDialog = useDialogOpener(ConfirmDialog);

  const handleClean = React.useCallback(() => {
    if (!stage || !cdPipeline || !cleanPipelineRunTemplate) {
      return;
    }

    if (!cleanPipelineRunTemplate) {
      showRequestErrorMessage(k8sOperation.create, {
        customMessage: {
          message: "Clean PipelineRun template is not found.",
          options: {
            variant: "error",
          },
        },
      });

      return;
    }

    const newCleanPipelineRun = createCleanPipelineRunDraft({
      cdPipeline,
      stage,
      pipelineRunTemplate: cleanPipelineRunTemplate,
    });

    triggerCreatePipelineRun({ data: { pipelineRun: newCleanPipelineRun } });
  }, [cdPipeline, cleanPipelineRunTemplate, showRequestErrorMessage, stage, triggerCreatePipelineRun]);

  const handleClickClean = React.useCallback(() => {
    openConfirmDialog({
      text: "Are you sure you want to clean up the environment?",
      actionCallback: async () => handleClean(),
    });
  }, [handleClean, openConfirmDialog]);

  return (
    <ButtonWithPermission
      ButtonProps={{
        variant: "outlined",
        size: "medium",
        onClick: handleClickClean,
        startIcon: latestCleanPipelineRunIsRunning ? <LoadingSpinner size={16} /> : <Trash size={16} />,
        disabled: latestDeployPipelineRunIsRunning || latestCleanPipelineRunIsRunning,
      }}
      allowed={pipelineRunPermissions.data?.create.allowed}
      reason={pipelineRunPermissions.data?.create.reason}
    >
      Clean
    </ButtonWithPermission>
  );
};
