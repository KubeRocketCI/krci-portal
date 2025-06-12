import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useCodebasePermissions } from "@/core/k8s/api/groups/KRCI/Codebase";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ManageCodebaseBranchDialog } from "@/modules/platform/codebases/dialogs/ManageCodebaseBranch";
import { Plus } from "lucide-react";
import { TableHeaderActionsProps } from "./types";

export const TableHeaderActions = ({
  codebase,
  defaultBranch,
  sortedCodebaseBranchList,
  reviewPipelineName,
  buildPipelineName,
}: TableHeaderActionsProps) => {
  const { setDialog } = useDialogContext();

  const permissions = useCodebasePermissions();

  return (
    <ButtonWithPermission
      ButtonProps={{
        startIcon: <Plus size={16} />,
        color: "primary",
        variant: "contained",
        onClick: () => {
          setDialog(ManageCodebaseBranchDialog, {
            codebaseBranches: sortedCodebaseBranchList,
            codebase,
            defaultBranch,
            pipelines: {
              review: reviewPipelineName,
              build: buildPipelineName,
            },
          });
        },
      }}
      allowed={permissions.data.create.allowed}
      reason={permissions.data.create.reason}
    >
      Create branch
    </ButtonWithPermission>
  );
};
