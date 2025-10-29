import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Section } from "@/core/components/Section";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ManageCodebaseBranchDialog } from "@/modules/platform/codebases/dialogs/ManageCodebaseBranch";
import { CodebaseBranch } from "@my-project/shared";
import React from "react";
import { useCodebaseBranchListWatch, useCodebaseWatch, usePipelineNamesWatch } from "../../hooks/data";
import { BranchListActions } from "./components/BranchListActions";
import { BranchListItem } from "./components/BranchListItem";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export const BranchList = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();
  const defaultBranch = codebaseBranchListWatch.data.array[0];

  const { setDialog } = useDialogContext();

  const [expandedPanel, setExpandedPanel] = React.useState<string | null>(
    codebaseBranchListWatch?.data.array.length === 1 ? codebaseBranchListWatch?.data.array[0].spec.branchName : null
  );

  const handleChange = React.useCallback(
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanel(isExpanded ? panel : null);
    },
    []
  );

  const pipelineNamesWatch = usePipelineNamesWatch();
  const pipelineNames = pipelineNamesWatch.data;

  return (
    <Section
      title={
        <div className="flex items-center gap-1 justify-between w-full">
          <div>
            <h1 className="text-4xl font-bold">
              Branches <LearnMoreLink url={EDP_USER_GUIDE.BRANCHES_MANAGE.url} />
            </h1>
          </div>
          <div className="ml-auto">
            <BranchListActions />
          </div>
        </div>
      }
    >
      <LoadingWrapper isLoading={!codebaseBranchListWatch.query.isFetched}>
        <>
          {codebaseBranchListWatch.data.array.length ? (
            <>
              {codebaseBranchListWatch.data.array.map((codebaseBranch: CodebaseBranch) => {
                const branchId = codebaseBranch.metadata.name;

                return (
                  <BranchListItem
                    key={branchId}
                    id={branchId}
                    codebaseBranch={codebaseBranch}
                    expandedPanel={expandedPanel}
                    handlePanelChange={handleChange}
                  />
                );
              })}
            </>
          ) : (
            <EmptyList
              missingItemName={"branches"}
              handleClick={() =>
                setDialog(ManageCodebaseBranchDialog, {
                  codebaseBranches: codebaseBranchListWatch.data.array,
                  codebase: codebase!,
                  defaultBranch: defaultBranch!,
                  pipelines: {
                    review: pipelineNames?.reviewPipelineName || "",
                    build: pipelineNames?.buildPipelineName || "",
                  },
                })
              }
            />
          )}
        </>
      </LoadingWrapper>
    </Section>
  );
};
