import { DataTable } from "@/core/components/Table";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Card } from "@/core/components/ui/card";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { TABLE } from "@/k8s/constants/tables";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { CreateCodebaseBranchDialog } from "@/modules/platform/codebases/components/CreateCodebaseBranchDialog";
import { pipelineRunLabels, pipelineType, sortKubeObjectByCreationTimestamp } from "@my-project/shared";
import React from "react";
import {
  useCodebaseBranchListWatch,
  useCodebaseWatch,
  useCodebasePipelineRunListWatch,
  usePipelineNamesWatch,
} from "../../hooks/data";
import { BranchListActions } from "./components/BranchListActions";
import { useColumns } from "./hooks/useColumns";
import { EnrichedBranch } from "./types";

export const BranchList = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();
  const codebasePipelineRunListWatch = useCodebasePipelineRunListWatch();
  const defaultBranch = codebaseBranchListWatch.data.array[0];

  const { setDialog } = useDialogContext();
  const pipelineNamesWatch = usePipelineNamesWatch();
  const pipelineNames = pipelineNamesWatch.data;

  const { loadSettings } = useTableSettings(TABLE.BRANCH_LIST.id);
  const tableSettings = loadSettings();
  const columns = useColumns({ tableSettings });

  const enrichedBranches: EnrichedBranch[] = React.useMemo(() => {
    const branches = codebaseBranchListWatch.data.array;
    const allPipelineRuns = [...codebasePipelineRunListWatch.data.array].sort(sortKubeObjectByCreationTimestamp);
    return branches.map((codebaseBranch) => {
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
  }, [codebaseBranchListWatch.data.array, codebasePipelineRunListWatch.data.array]);

  const isLoading = !codebaseBranchListWatch.query.isFetched;
  const hasBranches = codebaseBranchListWatch.data.array.length > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground text-xl font-semibold">Branches</h3>
          <LearnMoreLink url={EDP_USER_GUIDE.BRANCHES_MANAGE.url} />
        </div>
        <BranchListActions />
      </div>
      {hasBranches ? (
        <DataTable<EnrichedBranch>
          id={TABLE.BRANCH_LIST.id}
          name={TABLE.BRANCH_LIST.name}
          data={enrichedBranches}
          columns={columns}
          isLoading={isLoading}
          emptyListComponent={<EmptyList missingItemName="branches" />}
          settings={{ show: false }}
          outlined={false}
        />
      ) : (
        <EmptyList
          missingItemName="branches"
          handleClick={() =>
            setDialog(CreateCodebaseBranchDialog, {
              codebaseBranches: codebaseBranchListWatch.data.array,
              codebase: codebase!,
              defaultBranch: defaultBranch!,
              pipelines: {
                review: pipelineNames?.reviewPipelineName || "",
                build: pipelineNames?.buildPipelineName || "",
                security: pipelineNames?.securityPipelineName || "",
              },
            })
          }
        />
      )}
    </Card>
  );
};
