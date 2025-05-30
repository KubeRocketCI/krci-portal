import { useDialogContext } from "@/core/providers/Dialog/hooks";
import React from "react";
import { ConflictItemError } from "./components/ConflictItemError";
import { useDeletionConflictItem } from "./hooks/useDeletionConflictItem";
import { CodebaseBranchActionsProps } from "./types";
import { checkIsDefaultBranch } from "@my-project/shared";

export const CodebaseBranchActionsMenu = ({
  data: { codebase, codebaseBranch, codebaseBranches, defaultBranch },
  variant,
  handleCloseResourceActionListMenu,
  anchorEl,
}: CodebaseBranchActionsProps) => {
  const { setDialog: setNewDialog } = useDialogContext();

  const defaultBranchName = defaultBranch?.spec.branchName;

  const conflictedCDPipeline = useDeletionConflictItem(codebaseBranch, codebase);

  const onBeforeSubmit = React.useCallback(
    async (handleError, setLoadingActive) => {
      setLoadingActive(true);
      if (!conflictedCDPipeline) {
        setLoadingActive(false);
        return;
      }

      handleError(
        <ConflictItemError conflictedCDPipeline={conflictedCDPipeline} name={codebaseBranch.spec.branchName} />
      );
      setLoadingActive(false);
    },
    [codebaseBranch.spec.branchName, conflictedCDPipeline]
  );

  const isDefaultBranch = checkIsDefaultBranch(codebase, codebaseBranch)

  const actions = React.useMemo(() => {
    if (!branch) {
      return [];
    }

    return [
      createResourceAction({
        type: RESOURCE_ACTION.EDIT,
        label: capitalizeFirstLetter(RESOURCE_ACTION.EDIT),
        item: branch,
        icon: ICONS.PENCIL,
        disabled: {
          status: !permissions.update.CodebaseBranch.allowed,
          reason: permissions.update.CodebaseBranch.reason,
        },
        callback: (branch) => {
          if (variant === ACTION_MENU_TYPE.MENU && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          setNewDialog(ManageCodebaseBranchDialog, {
            codebaseBranches,
            codebase: codebaseData,
            defaultBranch,
            codebaseBranch: branch,
            pipelines: {
              review: pipelines?.review,
              build: pipelines?.build,
            },
          });
        },
      }),
      createResourceAction({
        type: RESOURCE_ACTION.DELETE,
        label: capitalizeFirstLetter(RESOURCE_ACTION.DELETE),
        item: branch,
        icon: ICONS.BUCKET,
        disabled: {
          status: isDefaultBranch ? true : !permissions?.delete?.CodebaseBranch.allowed,
          reason: isDefaultBranch ? "You cannot delete the default branch" : permissions?.delete?.CodebaseBranch.reason,
        },
        callback: (branch) => {
          if (variant === ACTION_MENU_TYPE.MENU && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          setNewDialog(DeleteKubeObjectDialog, {
            objectName: branch?.spec?.branchName,
            kubeObject: CodebaseBranchKubeObject,
            kubeObjectData: branch,
            description: `Confirm the deletion of the codebase branch with all its components`,
            onBeforeSubmit,
          });
        },
      }),
    ];
  }, [
    branch,
    codebaseBranches,
    codebaseData,
    defaultBranch,
    handleCloseResourceActionListMenu,
    isDefaultBranch,
    onBeforeSubmit,
    permissions?.delete?.CodebaseBranch.allowed,
    permissions?.delete?.CodebaseBranch.reason,
    permissions.update.CodebaseBranch.allowed,
    permissions.update.CodebaseBranch.reason,
    pipelines?.build,
    pipelines?.review,
    setNewDialog,
    variant,
  ]);

  return variant === ACTION_MENU_TYPE.INLINE ? (
    <ActionsInlineList actions={actions} />
  ) : variant === ACTION_MENU_TYPE.MENU ? (
    <ActionsMenuList
      actions={actions}
      anchorEl={anchorEl!}
      handleCloseActionsMenu={handleCloseResourceActionListMenu!}
    />
  ) : null;
};
