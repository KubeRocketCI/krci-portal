import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { Plus } from "lucide-react";
import { useCodebaseBranchPermissions } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useOpenCreateBranchDialog } from "../../hooks/useOpenCreateBranchDialog";

export const BranchListActions = () => {
  const openCreateBranchDialog = useOpenCreateBranchDialog();
  const permissions = useCodebaseBranchPermissions();

  return (
    <div data-tour="create-branch-button">
      <ButtonWithPermission
        ButtonProps={{
          variant: "default",
          onClick: openCreateBranchDialog,
        }}
        allowed={permissions.data.create.allowed}
        reason={permissions.data.create.reason}
      >
        <Plus size={16} />
        Create Branch
      </ButtonWithPermission>
    </div>
  );
};
