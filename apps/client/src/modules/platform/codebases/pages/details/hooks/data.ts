import { useApplicationWatchList } from "@/k8s/api/groups/ArgoCD/Application";
import { useCodebaseWatchItem } from "@/k8s/api/groups/KRCI/Codebase";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { useQuickLinkWatchList } from "@/k8s/api/groups/KRCI/QuickLink";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useTriggerTemplateWatchItem } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import {
  CodebaseBranch,
  applicationLabels,
  codebaseBranchLabels,
  createBuildPipelineRef,
  createReviewPipelineRef,
  createSecurityPipelineRef,
  pipelineRunLabels,
} from "@my-project/shared";
import { routeProjectDetails } from "../route";
import { useQuery } from "@tanstack/react-query";
import { sortCodebaseBranchesMap } from "@/k8s/api/groups/KRCI/CodebaseBranch/utils/sort";

export const useCodebaseWatch = () => {
  const params = routeProjectDetails.useParams();

  return useCodebaseWatchItem({
    name: params.name,
    namespace: params.namespace,
    queryOptions: {
      enabled: !!params.name,
    },
  });
};

export const useCodebaseBranchListWatch = () => {
  const params = routeProjectDetails.useParams();

  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  return useCodebaseBranchWatchList({
    namespace: params.namespace,
    labels: {
      [codebaseBranchLabels.codebase]: params.name,
    },
    queryOptions: {
      enabled: !!params.name,
    },
    transform: (items) => {
      if (!codebase) return items;
      return sortCodebaseBranchesMap(items, codebase);
    },
  });
};

export const useGitServerWatch = () => {
  const params = routeProjectDetails.useParams();

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
  const params = routeProjectDetails.useParams();

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

/** All pipeline runs for the current codebase (all branches). Use for Pipelines tab with branch filter. */
export const useCodebasePipelineRunListWatch = () => {
  const params = routeProjectDetails.useParams();

  return usePipelineRunWatchList({
    namespace: params.namespace,
    labels: {
      [pipelineRunLabels.codebase]: params.name,
    },
    queryOptions: {
      enabled: !!params.name,
    },
  });
};

export const useBuildTriggerTemplateWatch = () => {
  const params = routeProjectDetails.useParams();

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

export const useSecurityTriggerTemplateWatch = () => {
  const params = routeProjectDetails.useParams();

  const gitServerByCodebaseWatch = useGitServerWatch();
  const gitServerByCodebase = gitServerByCodebaseWatch.query.data;

  return useTriggerTemplateWatchItem({
    name: `${gitServerByCodebase?.spec?.gitProvider}-security-template`,
    namespace: params.namespace,
    queryOptions: {
      enabled: !!gitServerByCodebase?.spec?.gitProvider,
    },
  });
};

export const useQuickLinkListWatch = () => {
  const params = routeProjectDetails.useParams();

  return useQuickLinkWatchList({
    namespace: params.namespace,
  });
};

export const usePipelineNamesWatch = () => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();
  const defaultBranch = codebaseBranchListWatch.data.array[0];

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

      const securityPipelineName = createSecurityPipelineRef({
        gitServer: gitServerByCodebase!,
        codebase: codebase!,
        defaultBranch: defaultBranch,
      });

      return {
        reviewPipelineName,
        buildPipelineName,
        securityPipelineName,
      };
    },
    enabled: Boolean(codebase && gitServerByCodebase && defaultBranch),
  });
};

export const useCodebaseApplicationsWatch = () => {
  const params = routeProjectDetails.useParams();

  return useApplicationWatchList({
    namespace: params.namespace,
    labels: {
      [applicationLabels.appName]: params.name,
    },
  });
};

export const useCodebaseStagesWatch = () => {
  const params = routeProjectDetails.useParams();

  return useStageWatchList({
    namespace: params.namespace,
  });
};
