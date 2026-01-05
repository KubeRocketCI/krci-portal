import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import EditorYAML from "@/core/components/EditorYAML";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { usePipelineCRUD, usePipelinePermissions } from "@/k8s/api/groups/Tekton/Pipeline";
import { usePipelineRunCRUD } from "@/k8s/api/groups/Tekton/PipelineRun";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import {
  k8sOperation,
  Pipeline,
  PipelineRun,
  createPipelineRunDraftFromPipeline,
  pipelineLabels,
} from "@my-project/shared";
import { Play, Edit } from "lucide-react";
import React from "react";
import { PipelineActionsMenuProps } from "./types";
import { useTriggerTemplateWatchItem } from "@/k8s/api/groups/Tekton/TriggerTemplate";

export const PipelineActionsMenu = ({ variant, data: { pipeline } }: PipelineActionsMenuProps) => {
  const pipelinePermissions = usePipelinePermissions();
  const { triggerCreatePipelineRun } = usePipelineRunCRUD();
  const { triggerPatchPipeline } = usePipelineCRUD();

  const openEditorDialog = useDialogOpener(EditorYAML);

  const pipelineTriggerTemplateName = pipeline?.metadata?.labels[pipelineLabels.triggerTemplate];

  const triggerTemplateWatch = useTriggerTemplateWatchItem({
    name: pipelineTriggerTemplateName,
    namespace: pipeline?.metadata?.namespace,
  });

  const triggerTemplate = triggerTemplateWatch.query.data;

  const actions = React.useMemo(() => {
    if (!pipeline) {
      return [];
    }

    return [
      createResourceAction({
        type: k8sOperation.create,
        label: "Run with params",
        Icon: <Play size={16} />,
        item: pipeline,
        disabled: {
          status: !pipelinePermissions.data.create.allowed,
          reason: pipelinePermissions.data.create.reason,
        },
        callback: (pipeline: Pipeline) => {
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
        },
      }),
      createResourceAction({
        type: k8sOperation.patch,
        label: "Edit",
        Icon: <Edit size={16} />,
        item: pipeline,
        disabled: {
          status: !pipelinePermissions.data.patch.allowed,
          reason: pipelinePermissions.data.patch.reason,
        },
        callback: (pipeline: Pipeline) => {
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
        },
      }),
    ];
  }, [
    pipeline,
    pipelinePermissions.data.create.allowed,
    pipelinePermissions.data.create.reason,
    pipelinePermissions.data.patch.allowed,
    pipelinePermissions.data.patch.reason,
    triggerTemplate,
    openEditorDialog,
    triggerCreatePipelineRun,
    triggerPatchPipeline,
  ]);

  return (
    <>
      {variant === actionMenuType.inline ? (
        <ActionsInlineList actions={actions} />
      ) : variant === actionMenuType.menu ? (
        <ActionsMenuList actions={actions} />
      ) : null}
    </>
  );
};
