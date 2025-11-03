import { IconButton, Tooltip } from "@mui/material";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { useStyles } from "./styles";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink";
import { ManageQuickLinkDialog } from "@/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink";
import { Plus } from "lucide-react";

export const AddNewQuickLinkCard = () => {
  const classes = useStyles();

  const { setDialog } = useDialogContext();
  const quickLinkPermissions = useQuickLinkPermissions();

  return (
    <ConditionalWrapper
      condition={!quickLinkPermissions.data.create.allowed}
      wrapper={(children) => (
        <Tooltip title={quickLinkPermissions.data.create.reason}>
          <div>{children}</div>
        </Tooltip>
      )}
    >
      <IconButton
        className={classes.cardRoot}
        onClick={() => setDialog(ManageQuickLinkDialog, { quickLink: undefined })}
        disabled={!quickLinkPermissions.data.create.allowed}
      >
        <div className="flex items-center gap-2">
          <Plus size={16} />
          <span className="text-base font-medium">ADD LINK</span>
        </div>
      </IconButton>
    </ConditionalWrapper>
  );
};
