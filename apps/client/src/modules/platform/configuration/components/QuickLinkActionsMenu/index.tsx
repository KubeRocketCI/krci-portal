import React from "react";
import { QuickLinkActionsMenuProps } from "./types";
import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { ManageQuickLinkDialog } from "../../dialogs/ManageQuickLink";
import { isSystemQuickLink, useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink";
import { k8sOperation, k8sQuickLinkConfig } from "@my-project/shared";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { Pencil, Trash } from "lucide-react";

export const QuickLinkActionsMenu = ({
  backRoute,
  variant,
  data: { quickLink },
  anchorEl,
  handleCloseResourceActionListMenu,
}: QuickLinkActionsMenuProps) => {
  const { setDialog } = useDialogContext();

  const isSystemQuickLinkBool = isSystemQuickLink(quickLink);
  const quickLinkPermissions = useQuickLinkPermissions();

  const actions = React.useMemo(() => {
    if (!quickLink) {
      return [];
    }

    return [
      createResourceAction({
        type: k8sOperation.patch,
        label: capitalizeFirstLetter(k8sOperation.patch),
        Icon: <Pencil size={16} />,

        item: quickLink,
        disabled: {
          status: !quickLinkPermissions.data.patch.allowed,
          reason: quickLinkPermissions.data.patch.reason,
        },
        callback: (quickLink) => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          setDialog(ManageQuickLinkDialog, {
            quickLink,
            isSystem: isSystemQuickLinkBool,
          });
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        Icon: <Trash size={16} />,
        item: quickLink,
        disabled: {
          status: !quickLinkPermissions.data.delete.allowed || isSystemQuickLinkBool,
          reason: !quickLinkPermissions.data.delete.allowed
            ? quickLinkPermissions.data.delete.reason
            : isSystemQuickLinkBool
              ? "System QuickLink cannot be deleted"
              : "",
        },
        callback: (quickLink) => {
          setDialog(DeleteKubeObjectDialog, {
            objectName: quickLink?.metadata?.name,
            resource: quickLink,
            resourceConfig: k8sQuickLinkConfig,
            description: "Confirm the deletion of the QuickLink",
            backRoute,
          });

          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }
        },
      }),
    ];
  }, [
    backRoute,
    handleCloseResourceActionListMenu,
    isSystemQuickLinkBool,
    quickLink,
    quickLinkPermissions.data.delete.allowed,
    quickLinkPermissions.data.delete.reason,
    quickLinkPermissions.data.patch.allowed,
    quickLinkPermissions.data.patch.reason,
    setDialog,
    variant,
  ]);

  return variant === "inline" ? (
    <ActionsInlineList actions={actions} />
  ) : variant === "menu" ? (
    <ActionsMenuList actions={actions} anchorEl={anchorEl} handleCloseActionsMenu={handleCloseResourceActionListMenu} />
  ) : null;
};
