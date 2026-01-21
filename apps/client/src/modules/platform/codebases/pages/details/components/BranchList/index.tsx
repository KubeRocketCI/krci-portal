import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { SubSection } from "@/core/components/SubSection";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ManageCodebaseBranchDialog } from "@/modules/platform/codebases/dialogs/ManageCodebaseBranch";
import { CodebaseBranch } from "@my-project/shared";
import React from "react";
import { useCodebaseBranchListWatch, useCodebaseWatch, usePipelineNamesWatch } from "../../hooks/data";
import { BranchListActions } from "./components/BranchListActions";
import { BranchListItem } from "./components/BranchListItem";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Accordion } from "@/core/components/ui/accordion";

export const BranchList = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();
  const defaultBranch = codebaseBranchListWatch.data.array[0];

  const { setDialog } = useDialogContext();

  const [expandedPanel, setExpandedPanel] = React.useState<string | undefined>(
    codebaseBranchListWatch?.data.array.length === 1
      ? codebaseBranchListWatch?.data.array[0].spec.branchName
      : undefined
  );

  const handleChange = React.useCallback((value: string) => {
    setExpandedPanel(value);
  }, []);

  const pipelineNamesWatch = usePipelineNamesWatch();
  const pipelineNames = pipelineNamesWatch.data;

  return (
    <SubSection
      title={
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">Branches</h1>
          <LearnMoreLink url={EDP_USER_GUIDE.BRANCHES_MANAGE.url} />
        </div>
      }
      actions={<BranchListActions />}
    >
      <LoadingWrapper isLoading={!codebaseBranchListWatch.query.isFetched}>
        <>
          {codebaseBranchListWatch.data.array.length ? (
            <Accordion type="single" collapsible value={expandedPanel} onValueChange={handleChange}>
              {codebaseBranchListWatch.data.array.map((codebaseBranch: CodebaseBranch) => {
                const branchId = codebaseBranch.metadata.name;

                return (
                  <div key={branchId}>
                    <BranchListItem id={branchId} codebaseBranch={codebaseBranch} />
                  </div>
                );
              })}
            </Accordion>
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
                    security: pipelineNames?.securityPipelineName || "",
                  },
                })
              }
            />
          )}
        </>
      </LoadingWrapper>
    </SubSection>
  );
};
