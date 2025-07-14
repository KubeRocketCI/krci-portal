import { useCodebaseWatchItem } from "@/core/k8s/api/groups/KRCI/Codebase";
import { useCodebaseBranchWatchList } from "@/core/k8s/api/groups/KRCI/CodebaseBranch";
import { useGitServerWatchItem } from "@/core/k8s/api/groups/KRCI/GitServer";
import { useQuickLinkWatchList } from "@/core/k8s/api/groups/KRCI/QuickLink";
import { usePipelineRunWatchList } from "@/core/k8s/api/groups/Tekton/PipelineRun";
import { useTriggerTemplateWatchItem } from "@/core/k8s/api/groups/Tekton/TriggerTemplate";
import {
  checkIsDefaultBranch,
  CodebaseBranch,
  codebaseBranchLabels,
  createBuildPipelineRef,
  createReviewPipelineRef,
  pipelineRunLabels,
} from "@my-project/shared";
import React from "react";
import { routeComponentDetails } from "../route";
import { useQuery } from "@tanstack/react-query";

export const useCodebaseWatch = () => {
  const params = routeComponentDetails.useParams();

  return useCodebaseWatchItem({
    name: params.name,
    namespace: params.namespace,
    queryOptions: {
      enabled: !!params.name,
    },
  });
};

export const useCodebaseBranchListWatch = () => {
  const params = routeComponentDetails.useParams();

  return useCodebaseBranchWatchList({
    namespace: params.namespace,
    labels: {
      [codebaseBranchLabels.codebase]: params.name,
    },
    queryOptions: {
      enabled: !!params.name,
    },
  });
};

export const useGitServerWatch = () => {
  const params = routeComponentDetails.useParams();

  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  return useGitServerWatchItem({
    name: codebase?.spec.gitServer,
    namespace: params.namespace,
    queryOptions: {
      enabled: !!codebase?.spec.gitServer,
    },
  });
};

export const useCodebaseBranchPipelineRunListWatch = (codebaseBranch: CodebaseBranch) => {
  const params = routeComponentDetails.useParams();

  return usePipelineRunWatchList({
    namespace: params.namespace,
    labels: {
      [pipelineRunLabels.codebaseBranch]: codebaseBranch.metadata.name,
    },
    queryOptions: {
      enabled: !!codebaseBranch,
    },
  });
};

export const useBuildTriggerTemplateWatch = () => {
  const params = routeComponentDetails.useParams();

  const gitServerByCodebaseWatch = useGitServerWatch();
  const gitServerByCodebase = gitServerByCodebaseWatch.query.data;

  return useTriggerTemplateWatchItem({
    name: `${gitServerByCodebase?.spec?.gitProvider}-build-template`,
    namespace: params.namespace,
    queryOptions: {
      enabled: !!gitServerByCodebase?.spec?.gitProvider,
    },
  });
};

export const useQuickLinkListWatch = () => {
  const params = routeComponentDetails.useParams();

  return useQuickLinkWatchList({
    namespace: params.namespace,
  });
};

export const usePipelineNamesWatch = () => {
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

  const gitServerByCodebaseWatch = useGitServerWatch();
  const gitServerByCodebase = gitServerByCodebaseWatch.query.data;

  return useQuery({
    queryKey: [
      "pipeline-names",
      codebase?.metadata.name,
      gitServerByCodebase?.metadata.name,
      defaultBranch?.metadata.name,
    ],
    queryFn: () => {
      const reviewPipelineName = createReviewPipelineRef({
        gitServer: gitServerByCodebase!,
        codebase: codebase!,
        defaultBranch: defaultBranch,
      });

      const buildPipelineName = createBuildPipelineRef({
        gitServer: gitServerByCodebase!,
        codebase: codebase!,
        defaultBranch: defaultBranch,
      });

      return {
        reviewPipelineName,
        buildPipelineName,
      };
    },
    enabled: Boolean(codebase && gitServerByCodebase && defaultBranch),
  });
};
