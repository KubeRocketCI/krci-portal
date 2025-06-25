import { EmptyList } from "@/core/components/EmptyList";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { Section } from "@/core/components/Section";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { ManageCodebaseBranchDialog } from "@/modules/platform/codebases/dialogs/ManageCodebaseBranch";
import { Grid, Typography } from "@mui/material";
import { CodebaseBranch } from "@my-project/shared";
import React from "react";
import { useDataContext } from "../../providers/Data/hooks";
import { BranchListActions } from "./components/BranchListActions";
import { BranchListItem } from "./components/BranchListItem";

export const BranchList = () => {
  const { codebaseWatch, codebaseBranches, defaultBranch, reviewPipelineName, buildPipelineName } = useDataContext();

  const { setDialog } = useDialogContext();

  const codebase = codebaseWatch.data;

  const [expandedPanel, setExpandedPanel] = React.useState<string | null>(
    codebaseBranches.length === 1 ? codebaseBranches[0].spec.branchName : null
  );

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

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
            {codebase && <BranchListActions />}
          </Grid>
        </Grid>
      }
    >
      {codebaseBranches.length && codebaseWatch.isFetched ? (
        <>
          {codebaseBranches.map((codebaseBranch: CodebaseBranch) => {
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
              codebaseBranches: codebaseBranches,
              codebase: codebase!,
              defaultBranch,
              pipelines: {
                review: reviewPipelineName,
                build: buildPipelineName,
              },
            })
          }
        />
      )}
    </Section>
  );
};
