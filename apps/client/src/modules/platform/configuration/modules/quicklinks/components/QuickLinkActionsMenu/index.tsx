import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { Pencil, Trash } from "lucide-react";
import { QuickLinkActionsMenuProps } from "./types";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { k8sOperation, k8sQuickLinkConfig } from "@my-project/shared";
import { ManageQuickLinkDialog } from "../../dialogs/ManageQuickLink";
import { isSystemQuickLink, useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import React from "react";
import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";

export const QuickLinkActionsMenu = ({
  backRoute,
  variant,
  data: { quickLink },
  anchorEl,
  handleCloseResourceActionListMenu,
}: QuickLinkActionsMenuProps) => {
  const openManageQuickLinkDialog = useDialogOpener(ManageQuickLinkDialog);
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const quickLinkPermissions = useQuickLinkPermissions();

  const actions = React.useMemo(() => {
    if (!quickLink) {
      return [];
    }

    const isSystemQuickLinkBool = isSystemQuickLink(quickLink);

    return [
      createResourceAction({
        type: k8sOperation.patch,
        label: capitalizeFirstLetter(k8sOperation.patch),
        item: quickLink,
        Icon: <Pencil size={16} />,
        disabled: {
          status: !quickLinkPermissions.data.patch.allowed,
          reason: quickLinkPermissions.data.patch.reason,
        },
        callback: () => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }
          openManageQuickLinkDialog({ quickLink });
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        item: quickLink,
        Icon: <Trash size={16} />,
        disabled: {
          status: !quickLinkPermissions.data.delete.allowed || isSystemQuickLinkBool,
          reason: !quickLinkPermissions.data.delete.allowed
            ? quickLinkPermissions.data.delete.reason
            : isSystemQuickLinkBool
              ? "System QuickLink cannot be deleted"
              : "",
        },
        callback: () => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          openDeleteKubeObjectDialog({
            objectName: quickLink?.metadata.name,
            resourceConfig: k8sQuickLinkConfig,
            resource: quickLink,
            description: `Confirm the deletion of the Deployment Flow with all its environments.`,
            backRoute,
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
    quickLink,
    quickLinkPermissions.data.patch.allowed,
    quickLinkPermissions.data.patch.reason,
    quickLinkPermissions.data.delete.allowed,
    quickLinkPermissions.data.delete.reason,
    variant,
    handleCloseResourceActionListMenu,
    openManageQuickLinkDialog,
    openDeleteKubeObjectDialog,
    backRoute,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList
      actions={actions}
      anchorEl={anchorEl!}
      handleCloseActionsMenu={handleCloseResourceActionListMenu!}
    />
  ) : null;
};
