import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useCodebaseBranchPermissions } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction, getResourceProtection, getDisabledState } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { checkIsDefaultBranch, k8sCodebaseBranchConfig, k8sOperation } from "@my-project/shared";
import { Settings, Trash } from "lucide-react";
import React from "react";
import { ManageCodebaseBranchDialog } from "../../dialogs/ManageCodebaseBranch";
import { ConflictItemError } from "./components/ConflictItemError";
import { useDeletionConflictItem } from "./hooks/useDeletionConflictItem";
import { CodebaseBranchActionsProps } from "./types";

export const CodebaseBranchActionsMenu = ({
  data: { codebase, codebaseBranch, codebaseBranches, defaultBranch, pipelines },
  variant,
}: CodebaseBranchActionsProps) => {
  const { setDialog: setNewDialog } = useDialogContext();

  const codebaseBranchPermissions = useCodebaseBranchPermissions();

  const conflictedCDPipeline = useDeletionConflictItem(codebaseBranch, codebase);

  const onBeforeSubmit = React.useCallback(
    async (handleError: (error: React.ReactNode) => void, setLoadingActive: (loading: boolean) => void) => {
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

  const isDefaultBranch = checkIsDefaultBranch(codebase, codebaseBranch);

  // Check if the branch is protected from updates (allows viewing but not saving)
  const patchProtection = getResourceProtection(codebaseBranch, k8sOperation.patch);
  const deleteProtection = getResourceProtection(codebaseBranch, k8sOperation.delete);

  const actions = React.useMemo(() => {
    if (!codebaseBranch) {
      return [];
    }

    // Default branch cannot be deleted - this takes precedence over other checks
    const deleteDisabled = isDefaultBranch
      ? { status: true, reason: "You cannot delete the default branch" }
      : getDisabledState(deleteProtection, codebaseBranchPermissions.data.delete);

    return [
      createResourceAction({
        type: k8sOperation.patch,
        label: "Configure",
        item: codebaseBranch,
        Icon: <Settings size={16} />,
        disabled: {
          status: !codebaseBranchPermissions.data.patch.allowed,
          reason: codebaseBranchPermissions.data.patch.reason,
        },
        callback: (codebaseBranch) => {
          setNewDialog(ManageCodebaseBranchDialog, {
            codebaseBranches,
            codebase,
            defaultBranch,
            codebaseBranch,
            pipelines: {
              review: pipelines?.review,
              build: pipelines?.build,
              security: pipelines?.security,
            },
            isProtected: patchProtection.isProtected,
          });
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        item: codebaseBranch,
        Icon: <Trash size={16} />,
        disabled: deleteDisabled,
        callback: (codebaseBranch) => {
          setNewDialog(DeleteKubeObjectDialog, {
            objectName: codebaseBranch?.spec?.branchName,
            resource: codebaseBranch,
            resourceConfig: k8sCodebaseBranchConfig,
            description: `Confirm the deletion of the codebase branch with all its components`,
            onBeforeSubmit,
          });
        },
      }),
    ];
  }, [
    codebase,
    codebaseBranch,
    codebaseBranchPermissions.data.delete,
    codebaseBranchPermissions.data.patch.allowed,
    codebaseBranchPermissions.data.patch.reason,
    codebaseBranches,
    defaultBranch,
    deleteProtection,
    isDefaultBranch,
    patchProtection.isProtected,
    onBeforeSubmit,
    pipelines?.build,
    pipelines?.review,
    pipelines?.security,
    setNewDialog,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList actions={actions} />
  ) : null;
};
