import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { sortCodebaseBranches } from "@/k8s/api/groups/KRCI/CodebaseBranch/utils/sort";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ManageCodebaseBranchDialog } from "@/modules/platform/codebases/dialogs/ManageCodebaseBranch";
import { Plus } from "lucide-react";
import React from "react";
import { useCodebaseBranchListWatch, useCodebaseWatch, usePipelineNamesWatch } from "../../../../hooks/data";
import { useCodebaseBranchPermissions } from "@/k8s/api/groups/KRCI/CodebaseBranch";

export const BranchListActions = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();

  const sortedCodebaseBranchList = React.useMemo(
    () => sortCodebaseBranches(codebaseBranchListWatch.dataArray, codebase!),
    [codebaseBranchListWatch.dataArray, codebase]
  );

  const defaultBranch = sortedCodebaseBranchList[0];

  const pipelineNamesWatch = usePipelineNamesWatch();

  const pipelineNames = pipelineNamesWatch.data;

  const { setDialog } = useDialogContext();

  const permissions = useCodebaseBranchPermissions();

  return (
    <ButtonWithPermission
      ButtonProps={{
        startIcon: <Plus size={16} />,
        color: "primary",
        variant: "contained",
        onClick: () => {
          setDialog(ManageCodebaseBranchDialog, {
            codebaseBranches: codebaseBranchListWatch.dataArray,
            codebase: codebase!,
            defaultBranch,
            pipelines: {
              review: pipelineNames?.reviewPipelineName || "",
              build: pipelineNames?.buildPipelineName || "",
            },
          });
        },
        // disabled: !pipelineNamesWatch.isFetched || !codebaseWatch.query.isFetched,
      }}
      allowed={permissions.data.create.allowed}
      reason={permissions.data.create.reason}
    >
      Create branch
    </ButtonWithPermission>
  );
};
