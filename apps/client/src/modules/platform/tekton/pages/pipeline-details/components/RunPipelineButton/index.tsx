import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import EditorYAML from "@/core/components/EditorYAML";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { usePipelinePermissions } from "@/k8s/api/groups/Tekton/Pipeline";
import { usePipelineRunCRUD } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useTriggerTemplateWatchItem } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { PipelineRun, createPipelineRunDraftFromPipeline, pipelineLabels } from "@my-project/shared";
import { Play } from "lucide-react";
import { usePipelineWatch } from "../../hooks/data";

export const RunPipelineButton = () => {
  const pipelineWatch = usePipelineWatch();
  const pipeline = pipelineWatch.query.data;
  const pipelinePermissions = usePipelinePermissions();
  const { triggerCreatePipelineRun } = usePipelineRunCRUD();
  const openEditorDialog = useDialogOpener(EditorYAML);

  const pipelineTriggerTemplateName = pipeline?.metadata?.labels?.[pipelineLabels.triggerTemplate];

  const triggerTemplateWatch = useTriggerTemplateWatchItem({
    name: pipelineTriggerTemplateName,
    namespace: pipeline?.metadata?.namespace,
  });

  const triggerTemplate = triggerTemplateWatch.query.data;

  const handleClick = () => {
    if (!pipeline) {
      return;
    }

    const newPipelineRun = createPipelineRunDraftFromPipeline(triggerTemplate, pipeline);

    openEditorDialog({
      content: newPipelineRun,
      onSave: (_yaml, json) => {
        if (!json) {
          return;
        }

        triggerCreatePipelineRun({
          data: {
            pipelineRun: json as PipelineRun,
          },
        });
      },
    });
  };

  return (
    <ButtonWithPermission
      ButtonProps={{
        variant: "default",
        size: "sm",
        onClick: handleClick,
      }}
      allowed={pipelinePermissions.data.create.allowed}
      reason={pipelinePermissions.data.create.reason}
    >
      <Play size={16} /> Run with params
    </ButtonWithPermission>
  );
};
