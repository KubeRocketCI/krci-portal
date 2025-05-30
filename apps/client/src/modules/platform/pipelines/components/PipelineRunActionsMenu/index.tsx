import {
  createRerunPipelineRun,
  getPipelineRunStatus,
  k8sOperation,
  KubeObjectBase,
  PipelineRun,
  pipelineRunReason,
} from "@my-project/shared";
import { CustomActionsInlineList } from "./components/CustomActionsInlineList";
import { PipelineRunActionsMenuProps } from "./types";
import React from "react";
import { actionMenuType } from "@/core/k8s/constants/actionMenuTypes";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/core/k8s/api/groups/Tekton/PipelineRun";
import { OctagonX, Redo2, Trash } from "lucide-react";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { router } from "@/core/router";

export const PipelineRunActionsMenu = ({
  backRoute,
  variant,
  data: { pipelineRun: _pipelineRun },
  anchorEl,
  handleCloseResourceActionListMenu,
}: PipelineRunActionsMenuProps) => {
  const status = getPipelineRunStatus(_pipelineRun);
  const pipelineRunPermissions = usePipelineRunPermissions();

  const { createPipelineRun, patchPipelineRun, deletePipelineRun } = usePipelineRunCRUD();

  const isInProgress = status.reason === pipelineRunReason.started || status.reason === pipelineRunReason.running;

  const onDelete = React.useCallback(() => {
    if (!backRoute) {
      return;
    }

    router.navigate(backRoute);
  }, [backRoute]);

  const [, setEditor] = React.useState<{
    open: boolean;
    data: KubeObjectBase | undefined;
  }>({
    open: false,
    data: undefined,
  });

  const handleOpenEditor = (data: KubeObjectBase) => {
    setEditor({ open: true, data });
  };

  // const handleCloseEditor = () => {
  //   setEditor({ open: false, data: undefined });
  // };

  // const handleEditorSave = (data: KubeObjectBase[]) => {
  //   const [item] = data;

  //   if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
  //     handleCloseResourceActionListMenu();
  //   }

  //   createPipelineRun({ pipelineRun: item as PipelineRun });

  //   handleCloseEditor();
  // };

  const actions = React.useMemo(() => {
    const pipelineRun = { ..._pipelineRun };
    delete pipelineRun.actionType;

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

          createPipelineRun({ pipelineRun: newPipelineRun as PipelineRun });
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
        callback: (pipelineRun) => {
          const newPipelineRun = createRerunPipelineRun(pipelineRun);
          handleOpenEditor(newPipelineRun);

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

                patchPipelineRun({ pipelineRun: newPipelineRun as PipelineRun });
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

          deletePipelineRun({ pipelineRun: pipelineRun as PipelineRun, callbacks: { onSuccess: onDelete } });
        },
      }),
    ];
  }, [
    _pipelineRun,
    pipelineRunPermissions.data.create.allowed,
    pipelineRunPermissions.data.create.reason,
    pipelineRunPermissions.data.patch.allowed,
    pipelineRunPermissions.data.patch.reason,
    pipelineRunPermissions.data.delete.allowed,
    pipelineRunPermissions.data.delete.reason,
    isInProgress,
    variant,
    handleCloseResourceActionListMenu,
    createPipelineRun,
    patchPipelineRun,
    deletePipelineRun,
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
