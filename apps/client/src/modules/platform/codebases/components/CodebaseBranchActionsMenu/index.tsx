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
import { EditCodebaseBranchDialog } from "../EditCodebaseBranchDialog";
import { useValidateDelete } from "@/k8s/api/hooks/useValidateDelete";
import { CodebaseBranchActionsProps } from "./types";

export const CodebaseBranchActionsMenu = ({
  data: { codebase, codebaseBranch },
  variant,
}: CodebaseBranchActionsProps) => {
  const { setDialog: setNewDialog } = useDialogContext();

  const codebaseBranchPermissions = useCodebaseBranchPermissions();

  const validateDelete = useValidateDelete();

  const onBeforeSubmit = React.useCallback(
    async (handleError: (error: React.ReactNode) => void, setLoadingActive: (loading: boolean) => void) => {
      setLoadingActive(true);

      try {
        const { allowed, reason } = await validateDelete(codebaseBranch, k8sCodebaseBranchConfig);

        if (!allowed) {
          handleError(reason);
        }
      } finally {
        setLoadingActive(false);
      }
    },
    [codebaseBranch, validateDelete]
  );

  const isDefaultBranch = checkIsDefaultBranch(codebase, codebaseBranch);

  // Check if the branch is protected from updates (allows viewing but not saving)
  const patchProtection = getResourceProtection(codebaseBranch, k8sOperation.update);
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
        type: k8sOperation.update,
        label: "Configure",
        item: codebaseBranch,
        Icon: <Settings size={16} />,
        disabled: {
          status: !codebaseBranchPermissions.data.update.allowed,
          reason: codebaseBranchPermissions.data.update.reason,
        },
        callback: (codebaseBranch) => {
          setNewDialog(EditCodebaseBranchDialog, {
            codebaseBranch,
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
    codebaseBranch,
    codebaseBranchPermissions.data.delete,
    codebaseBranchPermissions.data.update.allowed,
    codebaseBranchPermissions.data.update.reason,
    deleteProtection,
    isDefaultBranch,
    patchProtection.isProtected,
    onBeforeSubmit,
    setNewDialog,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList actions={actions} />
  ) : null;
};
