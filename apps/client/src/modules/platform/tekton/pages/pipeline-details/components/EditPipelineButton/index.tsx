import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import EditorYAML from "@/core/components/EditorYAML";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { usePipelineCRUD, usePipelinePermissions } from "@/k8s/api/groups/Tekton/Pipeline";
import { Pipeline } from "@my-project/shared";
import { Edit } from "lucide-react";
import { usePipelineWatch } from "../../hooks/data";

export const EditPipelineButton = () => {
  const pipelineWatch = usePipelineWatch();
  const pipeline = pipelineWatch.query.data;
  const pipelinePermissions = usePipelinePermissions();
  const { triggerPatchPipeline } = usePipelineCRUD();
  const openEditorDialog = useDialogOpener(EditorYAML);

  const handleClick = () => {
    if (!pipeline) {
      return;
    }

    openEditorDialog({
      content: pipeline,
      onSave: (_yaml, json) => {
        if (!json) {
          return;
        }

        triggerPatchPipeline({
          data: {
            pipeline: json as Pipeline,
          },
        });
      },
    });
  };

  return (
    <ButtonWithPermission
      ButtonProps={{
        variant: "outline",
        size: "sm",
        onClick: handleClick,
      }}
      allowed={pipelinePermissions.data.update.allowed}
      reason={pipelinePermissions.data.update.reason}
    >
      <Edit size={16} /> Edit
    </ButtonWithPermission>
  );
};
