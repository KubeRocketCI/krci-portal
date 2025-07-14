import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Section } from "@/core/components/Section";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ManageCodebaseBranchDialog } from "@/modules/platform/codebases/dialogs/ManageCodebaseBranch";
import { Grid, Typography } from "@mui/material";
import { checkIsDefaultBranch, CodebaseBranch } from "@my-project/shared";
import React from "react";
import { useCodebaseBranchListWatch, useCodebaseWatch, usePipelineNamesWatch } from "../../hooks/data";
import { BranchListActions } from "./components/BranchListActions";
import { BranchListItem } from "./components/BranchListItem";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export const BranchList = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();

  const sortedCodebaseBranchList = React.useMemo(() => {
    if (!codebase) {
      return codebaseBranchListWatch.dataArray;
    }
    return codebaseBranchListWatch.dataArray.sort((a) => (checkIsDefaultBranch(codebase!, a) ? -1 : 1));
  }, [codebaseBranchListWatch.dataArray, codebase]);

  const defaultBranch = sortedCodebaseBranchList[0];

  const { setDialog } = useDialogContext();

  const [expandedPanel, setExpandedPanel] = React.useState<string | null>(
    codebaseBranchListWatch?.dataArray.length === 1 ? codebaseBranchListWatch?.dataArray[0].spec.branchName : null
  );

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const pipelineNamesWatch = usePipelineNamesWatch();
  const pipelineNames = pipelineNamesWatch.data;

  return (
    <Section
      title={
        <Grid container alignItems={"center"} spacing={1}>
          <Grid item>
            <Typography variant={"h1"}>
              Branches <LearnMoreLink url={EDP_USER_GUIDE.BRANCHES_MANAGE.url} />
            </Typography>
          </Grid>
          <Grid item style={{ marginLeft: "auto" }}>
            <BranchListActions />
          </Grid>
        </Grid>
      }
    >
      <LoadingWrapper isLoading={!codebaseBranchListWatch.query.isFetched}>
        <>
          {codebaseBranchListWatch.dataArray.length ? (
            <>
              {codebaseBranchListWatch.dataArray.map((codebaseBranch: CodebaseBranch) => {
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
                  codebaseBranches: codebaseBranchListWatch.dataArray,
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
