import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import EditorYAML from "@/core/components/EditorYAML";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { router } from "@/core/router";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import {
  createRerunPipelineRun,
  getPipelineRunStatus,
  k8sOperation,
  PipelineRun,
  pipelineRunReason,
} from "@my-project/shared";
import { OctagonX, Redo2, Trash } from "lucide-react";
import React from "react";
import { CustomActionsInlineList } from "./components/CustomActionsInlineList";
import { PipelineRunActionsMenuProps } from "./types";

export const PipelineRunActionsMenu = ({
  backRoute,
  variant,
  data: { pipelineRun },
  anchorEl,
  handleCloseResourceActionListMenu,
}: PipelineRunActionsMenuProps) => {
  const status = getPipelineRunStatus(pipelineRun);
  const pipelineRunPermissions = usePipelineRunPermissions();

  const { triggerCreatePipelineRun, triggerPatchPipelineRun, triggerDeletePipelineRun } = usePipelineRunCRUD();

  const isInProgress = status.reason === pipelineRunReason.started || status.reason === pipelineRunReason.running;

  const onDelete = React.useCallback(() => {
    if (!backRoute) {
      return;
    }

    router.navigate(backRoute);
  }, [backRoute]);

  const openEditorDialog = useDialogOpener(EditorYAML);

  const actions = React.useMemo(() => {
    if (!pipelineRun) {
      return [];
    }

    return [
      createResourceAction({
        type: k8sOperation.create,
        label: "Run again",
        Icon: <Redo2 size={16} />,
        item: pipelineRun,
        disabled: {
          status: !pipelineRunPermissions.data.create.allowed,
          reason: pipelineRunPermissions.data.create.reason,
        },
        callback: (pipelineRun) => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          const newPipelineRun = createRerunPipelineRun(pipelineRun);

          triggerCreatePipelineRun({
            data: {
              pipelineRun: newPipelineRun,
            },
          });
        },
      }),
      createResourceAction({
        type: k8sOperation.create,
        label: "Run with params",
        Icon: <Redo2 size={16} />,
        item: pipelineRun,
        disabled: {
          status: !pipelineRunPermissions.data.create.allowed,
          reason: pipelineRunPermissions.data.create.reason,
        },
        callback: (pipelineRun: PipelineRun) => {
          const newPipelineRun = createRerunPipelineRun(pipelineRun);
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

          if (handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }
        },
      }),
      ...(isInProgress
        ? [
            createResourceAction({
              type: k8sOperation.patch,
              label: "Stop run",
              Icon: <OctagonX size={16} />,
              item: pipelineRun,
              disabled: {
                status: !pipelineRunPermissions.data.patch.allowed || !isInProgress,
                reason: !pipelineRunPermissions.data.patch.allowed
                  ? pipelineRunPermissions.data.patch.reason
                  : !isInProgress
                    ? "PipelineRun is no longer in progress"
                    : "",
              },
              callback: (pipelineRun) => {
                if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
                  handleCloseResourceActionListMenu();
                }

                const newPipelineRun = { ...pipelineRun };
                newPipelineRun.spec.status = "Cancelled";

                triggerPatchPipelineRun({ data: { pipelineRun: newPipelineRun } });
              },
            }),
          ]
        : []),
      createResourceAction({
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        Icon: <Trash size={16} />,
        item: pipelineRun,
        disabled: {
          status: !pipelineRunPermissions.data.delete.allowed,
          reason: pipelineRunPermissions.data.delete.reason,
        },
        callback: (pipelineRun) => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          triggerDeletePipelineRun({ data: { pipelineRun: pipelineRun }, callbacks: { onSuccess: onDelete } });
        },
      }),
    ];
  }, [
    pipelineRun,
    pipelineRunPermissions.data.create.allowed,
    pipelineRunPermissions.data.create.reason,
    pipelineRunPermissions.data.patch.allowed,
    pipelineRunPermissions.data.patch.reason,
    pipelineRunPermissions.data.delete.allowed,
    pipelineRunPermissions.data.delete.reason,
    isInProgress,
    variant,
    handleCloseResourceActionListMenu,
    triggerCreatePipelineRun,
    openEditorDialog,
    triggerPatchPipelineRun,
    triggerDeletePipelineRun,
    onDelete,
  ]);

  const groupActions = actions.slice(0, 2);
  const inlineActions = actions.slice(2);

  return (
    <>
      {/* {editor.open && editor.data && (
        <EditorDialog open={editor.open} item={editor.data} onClose={handleCloseEditor} onSave={handleEditorSave} />
      )} */}
      {variant === actionMenuType.inline ? (
        <CustomActionsInlineList groupActions={groupActions} inlineActions={inlineActions} />
      ) : variant === actionMenuType.menu && anchorEl ? (
        <ActionsMenuList
          actions={actions}
          anchorEl={anchorEl}
          handleCloseActionsMenu={handleCloseResourceActionListMenu}
        />
      ) : null}
    </>
  );
};
