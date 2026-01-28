import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { sortCodebaseBranches } from "@/k8s/api/groups/KRCI/CodebaseBranch/utils/sort";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { CreateCodebaseBranchDialog } from "@/modules/platform/codebases/components/CreateCodebaseBranchDialog";
import { Plus } from "lucide-react";
import React from "react";
import { useCodebaseBranchListWatch, useCodebaseWatch, usePipelineNamesWatch } from "../../../../hooks/data";
import { useCodebaseBranchPermissions } from "@/k8s/api/groups/KRCI/CodebaseBranch";

export const BranchListActions = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();

  const sortedCodebaseBranchList = React.useMemo(
    () => sortCodebaseBranches(codebaseBranchListWatch.data.array, codebase!),
    [codebaseBranchListWatch.data.array, codebase]
  );

  const defaultBranch = sortedCodebaseBranchList[0];

  const pipelineNamesWatch = usePipelineNamesWatch();

  const pipelineNames = pipelineNamesWatch.data;

  const { setDialog } = useDialogContext();

  const permissions = useCodebaseBranchPermissions();

  return (
    <ButtonWithPermission
      ButtonProps={{
        variant: "default",
        onClick: () => {
          setDialog(CreateCodebaseBranchDialog, {
            codebaseBranches: codebaseBranchListWatch.data.array,
            codebase: codebase!,
            defaultBranch,
            pipelines: {
              review: pipelineNames?.reviewPipelineName || "",
              build: pipelineNames?.buildPipelineName || "",
              security: pipelineNames?.securityPipelineName || "",
            },
          });
        },
        // disabled: !pipelineNamesWatch.isFetched || !codebaseWatch.query.isFetched,
      }}
      allowed={permissions.data.create.allowed}
      reason={permissions.data.create.reason}
    >
      <Plus size={16} />
      Create Branch
    </ButtonWithPermission>
  );
};
