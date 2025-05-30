import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { Grid, Typography } from "@mui/material";
import {
  CodebaseBranch,
  codebaseBranchLabels,
  createBuildPipelineRef,
  createReviewPipelineRef,
} from "@my-project/shared";
import { useParams } from "@tanstack/react-router";
import React from "react";
import { routeComponentDetails } from "../../route";
import { BranchListItem } from "./components/BranchListItem";
import { TableHeaderActions } from "./components/TableHeaderActions";
import { Section } from "@/core/components/Section";
import { ManageCodebaseBranchDialog } from "@/modules/platform/codebases/dialogs/ManageCodebaseBranch";
import { EmptyList } from "@/core/components/EmptyList";
import { useCodebaseBranchWatchList } from "@/core/k8s/api/groups/KRCI/CodebaseBranch";
import { useCodebaseWatchItem } from "@/core/k8s/api/groups/KRCI/Codebase";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";
import { useGitServerWatchItem } from "@/core/k8s/api/groups/KRCI/GitServer";
import { isDefaultBranch } from "../../utils";

export const BranchList = () => {
  const params = useParams({
    from: routeComponentDetails.id,
  });

  const { setDialog } = useDialogContext();

  const codebaseBranchListWatch = useCodebaseBranchWatchList({
    labels: {
      [codebaseBranchLabels.codebase]: params.name,
    },
    queryOptions: {
      enabled: !!params.name,
    },
  });

  const codebaseWatchQuery = useCodebaseWatchItem({
    name: params.name,
    queryOptions: {
      enabled: !!params.name,
    },
  });
  const codebase = codebaseWatchQuery.data;

  const sortedCodebaseBranchList = React.useMemo(() => {
    if (!codebase) {
      return codebaseBranchListWatch.dataArray;
    }
    return codebaseBranchListWatch.dataArray.sort((a) => (isDefaultBranch(codebase, a) ? -1 : 1));
  }, [codebase, codebaseBranchListWatch.dataArray]);

  const defaultBranch = sortedCodebaseBranchList[0];

  const gitServerByCodebase = useGitServerWatchItem({
    name: codebase?.spec.gitServer,
    queryOptions: {
      enabled: !!codebase?.spec.gitServer,
    },
  });

  const reviewPipelineName = React.useMemo(() => {
    if (defaultBranch) {
      return defaultBranch.spec?.pipelines?.review || "";
    }

    if (gitServerByCodebase.data && codebase) {
      return createReviewPipelineRef({
        gitServer: gitServerByCodebase.data!,
        codebase: codebase!,
      });
    }

    return "";
  }, [codebase, defaultBranch, gitServerByCodebase.data]);

  const buildPipelineName = React.useMemo(() => {
    if (defaultBranch) {
      return defaultBranch.spec?.pipelines?.build || "";
    }

    if (gitServerByCodebase.data && codebase) {
      return createBuildPipelineRef({
        gitServer: gitServerByCodebase.data!,
        codebase: codebase!,
      });
    }

    return "";
  }, [codebase, defaultBranch, gitServerByCodebase.data]);

  const [expandedPanel, setExpandedPanel] = React.useState<string | null>(
    sortedCodebaseBranchList.length === 1 ? sortedCodebaseBranchList[0].spec.branchName : null
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
            {codebase && (
              <TableHeaderActions
                codebase={codebase}
                defaultBranch={defaultBranch}
                sortedCodebaseBranchList={sortedCodebaseBranchList}
                reviewPipelineName={reviewPipelineName}
                buildPipelineName={buildPipelineName}
              />
            )}
          </Grid>
        </Grid>
      }
    >
      {sortedCodebaseBranchList.length && codebaseWatchQuery.isFetched ? (
        <>
          {sortedCodebaseBranchList.map((codebaseBranch: CodebaseBranch) => {
            const branchId = codebaseBranch.metadata.name;

            return (
              <BranchListItem
                key={branchId}
                id={branchId}
                codebaseBranchData={codebaseBranch}
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
              codebaseBranches: sortedCodebaseBranchList,
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
