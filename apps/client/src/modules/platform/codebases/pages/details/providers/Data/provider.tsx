import { useParams } from "@tanstack/react-router";
import { routeComponentDetails } from "../../route";
import { useCodebaseWatchItem } from "@/core/k8s/api/groups/KRCI/Codebase";
import { useCodebaseBranchWatchList } from "@/core/k8s/api/groups/KRCI/CodebaseBranch";
import { useQuickLinkWatchList } from "@/core/k8s/api/groups/KRCI/QuickLink";
import React from "react";
import { useGitServerWatchItem } from "@/core/k8s/api/groups/KRCI/GitServer";
import {
  checkIsDefaultBranch,
  codebaseBranchLabels,
  createBuildPipelineRef,
  createReviewPipelineRef,
} from "@my-project/shared";
import { DataContext } from "./context";

export const DataContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams({
    from: routeComponentDetails.id,
  });

  const codebaseWatch = useCodebaseWatchItem({
    name: params.name,
  });
  const codebase = codebaseWatch.data;

  const codebaseBranchListWatch = useCodebaseBranchWatchList({
    labels: {
      [codebaseBranchLabels.codebase]: params.name,
    },
    queryOptions: {
      enabled: !!params.name,
    },
  });

  const gitServerByCodebaseWatch = useGitServerWatchItem({
    name: codebase?.spec.gitServer,
    queryOptions: {
      enabled: !!codebase?.spec.gitServer,
    },
  });
  const gitServerByCodebase = gitServerByCodebaseWatch.data;

  const quickLinkListWatch = useQuickLinkWatchList();

  const sortedCodebaseBranchList = React.useMemo(() => {
    if (!codebaseWatch.data) {
      return codebaseBranchListWatch.dataArray;
    }
    return codebaseBranchListWatch.dataArray.sort((a) => (checkIsDefaultBranch(codebaseWatch.data, a) ? -1 : 1));
  }, [codebaseWatch.data, codebaseBranchListWatch.dataArray]);

  const defaultBranch = sortedCodebaseBranchList[0];

  const reviewPipelineName = React.useMemo(() => {
    if (defaultBranch) {
      return defaultBranch.spec?.pipelines?.review || "";
    }

    if (gitServerByCodebase && codebase) {
      return createReviewPipelineRef({
        gitServer: gitServerByCodebase!,
        codebase: codebase,
      });
    }

    return "";
  }, [codebase, defaultBranch, gitServerByCodebase]);

  const buildPipelineName = React.useMemo(() => {
    if (defaultBranch) {
      return defaultBranch.spec?.pipelines?.build || "";
    }

    if (gitServerByCodebase && codebase) {
      return createBuildPipelineRef({
        gitServer: gitServerByCodebase!,
        codebase: codebase,
      });
    }

    return "";
  }, [codebase, defaultBranch, gitServerByCodebase]);

  const value = React.useMemo(
    () => ({
      codebaseWatch,
      codebaseBranchListWatch,
      gitServerByCodebaseWatch,
      quickLinkListWatch,
      codebaseBranches: sortedCodebaseBranchList,
      defaultBranch,
      reviewPipelineName,
      buildPipelineName,
    }),
    [
      codebaseWatch,
      codebaseBranchListWatch,
      gitServerByCodebaseWatch,
      quickLinkListWatch,
      sortedCodebaseBranchList,
      defaultBranch,
      reviewPipelineName,
      buildPipelineName,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
