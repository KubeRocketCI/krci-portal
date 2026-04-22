import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction, getResourceProtection, getDisabledState } from "@/core/utils/createResourceAction";
import { useCodebasePermissions } from "@/k8s/api/groups/KRCI/Codebase";
import type { Codebase } from "@my-project/shared";
import { codebaseGitOpsSystemType, codebaseLabels, k8sCodebaseConfig, k8sOperation } from "@my-project/shared";
import { Settings, Trash } from "lucide-react";
import React from "react";

interface GitOpsActionsMenuProps {
  codebase: Codebase;
  onEdit: () => void;
  ownerReference: string | undefined;
}

export const GitOpsActionsMenu = ({ codebase, ownerReference, onEdit }: GitOpsActionsMenuProps) => {
  const codebasePermissions = useCodebasePermissions();
  const { setDialog } = useDialogContext();

  const patchProtection = getResourceProtection(codebase, k8sOperation.update);
  const deleteProtection = getResourceProtection(codebase, k8sOperation.delete);

  const actions = React.useMemo(() => {
    if (!codebase) {
      return [];
    }

    // Check if this is a system GitOps codebase
    const isSystemGitOps = codebase.metadata.labels?.[codebaseLabels.systemType] === codebaseGitOpsSystemType;
    const systemGitOpsReason = "System GitOps repository cannot be modified or deleted.";

    // Check if resource has owner references
    const hasOwnerReference = !!ownerReference;
    const ownerReferenceReason = "You cannot perform this action because the codebase has owner references.";

    // Compute disabled state for Edit action
    const editDisabled = isSystemGitOps
      ? { status: true, reason: systemGitOpsReason }
      : hasOwnerReference
        ? { status: true, reason: ownerReferenceReason }
        : getDisabledState(patchProtection, codebasePermissions.data.update);

    // Compute disabled state for Delete action
    const deleteDisabled = isSystemGitOps
      ? { status: true, reason: systemGitOpsReason }
      : hasOwnerReference
        ? { status: true, reason: ownerReferenceReason }
        : getDisabledState(deleteProtection, codebasePermissions.data.delete);

    return [
      createResourceAction({
        type: k8sOperation.update,
        label: "Edit",
        item: codebase,
        Icon: <Settings size={16} />,
        disabled: editDisabled,
        callback: () => {
          onEdit();
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: "Delete",
        item: codebase,
        Icon: <Trash size={16} />,
        disabled: deleteDisabled,
        callback: (codebase) => {
          setDialog(DeleteKubeObjectDialog, {
            objectName: codebase.metadata.name,
            resource: codebase,
            resourceConfig: k8sCodebaseConfig,
            description: "Confirm the deletion of the GitOps repository.",
            createCustomMessages: (item) => ({
              loading: {
                message: `${item.metadata.name} has been marked for deletion`,
              },
              error: {
                message: `Failed to initiate ${item.metadata.name}'s deletion`,
              },
              success: {
                message: "The deletion process has been started",
              },
            }),
          });
        },
      }),
    ];
  }, [
    codebase,
    ownerReference,
    patchProtection,
    deleteProtection,
    codebasePermissions.data.update,
    codebasePermissions.data.delete,
    onEdit,
    setDialog,
  ]);

  return <ActionsMenuList actions={actions} />;
};
