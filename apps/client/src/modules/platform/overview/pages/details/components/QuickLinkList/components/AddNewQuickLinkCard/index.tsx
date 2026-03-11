import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink";
import { ManageQuickLinkDialog } from "@/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink";
import { Plus } from "lucide-react";

export const AddNewQuickLinkCard = () => {
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
      <Button
        variant="ghost"
        className="bg-card h-auto w-full rounded-lg border border-dashed p-3 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-600 dark:hover:bg-blue-950/30"
        onClick={() => setDialog(ManageQuickLinkDialog, { quickLink: undefined })}
        disabled={!quickLinkPermissions.data.create.allowed}
      >
        <div className="flex items-center gap-1.5">
          <Plus size={16} className="text-muted-foreground group-hover:text-blue-500" />
          <span className="text-muted-foreground text-sm">Add Link</span>
        </div>
      </Button>
    </ConditionalWrapper>
  );
};
