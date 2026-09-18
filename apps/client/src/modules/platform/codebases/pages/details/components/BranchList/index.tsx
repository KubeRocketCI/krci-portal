import { DataTable } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Card } from "@/core/components/ui/card";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { TABLE } from "@/k8s/constants/tables";
import {
  pipelineRunLabels,
  pipelineType,
  sortKubeObjectByCreationTimestamp,
  sortCodebaseBranchesWithDefaultFirst,
} from "@my-project/shared";
import React from "react";
import { useCodebaseBranchListWatch, useCodebaseWatch, useCodebasePipelineRunListWatch } from "../../hooks/data";
import { BranchListActions } from "./components/BranchListActions";
import { useColumns } from "./hooks/useColumns";
import { useOpenCreateBranchDialog } from "./hooks/useOpenCreateBranchDialog";
import { EnrichedBranch } from "./types";

export const BranchList = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();
  const codebasePipelineRunListWatch = useCodebasePipelineRunListWatch();
  const openCreateBranchDialog = useOpenCreateBranchDialog();

  const columns = useColumns();

  const defaultBranchName = codebase?.spec.defaultBranch;
  const isRowPinned = React.useCallback(
    (row: EnrichedBranch) => row.codebaseBranch.spec.branchName === defaultBranchName,
    [defaultBranchName]
  );

  const enrichedBranches: EnrichedBranch[] = React.useMemo(() => {
    const branches = codebaseBranchListWatch.data.array;
    const allPipelineRuns = [...codebasePipelineRunListWatch.data.array].sort(sortKubeObjectByCreationTimestamp);

    const sortedBranches = sortCodebaseBranchesWithDefaultFirst(branches, codebase?.spec.defaultBranch);

    return sortedBranches.map((codebaseBranch) => {
      const branchId = codebaseBranch.metadata.name;
      const branchRuns = allPipelineRuns.filter(
        (pr) => pr.metadata.labels?.[pipelineRunLabels.codebaseBranch] === branchId
      );
      const latestBuildPipelineRun = branchRuns.find(
        (el) => el.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.build
      );
      const latestSecurityPipelineRun = branchRuns.find(
        (el) => el.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.security
      );
      return {
        codebaseBranch,
        latestBuildPipelineRun,
        latestSecurityPipelineRun,
      };
    });
  }, [codebaseBranchListWatch.data.array, codebasePipelineRunListWatch.data.array, codebase?.spec.defaultBranch]);

  return (
    <Card className="space-y-4 p-6" data-tour="branches-table">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground text-xl font-semibold">Branches</h3>
          <LearnMoreLink url={EDP_USER_GUIDE.BRANCHES_MANAGE.url} />
        </div>
        <BranchListActions />
      </div>
      <DataTable<EnrichedBranch>
        id={TABLE.BRANCH_LIST.id}
        name={TABLE.BRANCH_LIST.name}
        data={enrichedBranches}
        columns={columns}
        isRowPinned={isRowPinned}
        isLoading={codebaseBranchListWatch.isLoading}
        blockerError={codebaseBranchListWatch.error}
        emptyListComponent={<EmptyList missingItemName="branches" handleClick={openCreateBranchDialog} />}
        settings={{ show: false }}
        outlined={false}
      />
    </Card>
  );
};
