import { applicationLabels, codebaseLabels, codebaseType, stageLabels } from "@my-project/shared";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { routeCDPipelineDetails } from "../route";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useApplicationWatchList } from "@/k8s/api/groups/ArgoCD/Application";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch/hooks";
import { useQuickLinkWatchURLs } from "@/k8s/api/groups/KRCI/QuickLink/hooks/useQuickLinksUrlListQuery";

export const useQuickLinksUrlListWatch = () => {
  const params = routeCDPipelineDetails.useParams();

  return useQuickLinkWatchURLs(params.namespace);
};

export const useCDPipelineWatch = () => {
  const params = routeCDPipelineDetails.useParams();

  return useCDPipelineWatchItem({
    name: params.name,
    namespace: params.namespace,
  });
};

export const useStageListWatch = () => {
  const params = routeCDPipelineDetails.useParams();

  return useStageWatchList({
    labels: {
      [stageLabels.cdPipeline]: params.name,
    },
    namespace: params.namespace,
  });
};

export const useAppCodebaseListWatch = () => {
  const params = routeCDPipelineDetails.useParams();

  return useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.application,
    },
    namespace: params.namespace,
  });
};

// Watches all CodebaseBranches in the namespace. A label selector can't OR over multiple
// codebases (each app is a separate codebase), and N per-app watches would be costlier
// than one namespace-scoped watch.
export const useCodebaseBranchListWatch = () => {
  const params = routeCDPipelineDetails.useParams();

  return useCodebaseBranchWatchList({
    namespace: params.namespace,
  });
};

/**
 * Watch Argo applications for a specific stage.
 * Filters by both pipeline name and stage name.
 */
export const useStageArgoApplicationListWatch = (stageName: string) => {
  const params = routeCDPipelineDetails.useParams();

  return useApplicationWatchList({
    labels: {
      [applicationLabels.pipeline]: params.name,
      [applicationLabels.stage]: stageName,
    },
    namespace: params.namespace,
  });
};

/**
 * Watch all Argo applications for the entire pipeline.
 * Filters by pipeline name only.
 */
export const usePipelineArgoApplicationListWatch = () => {
  const params = routeCDPipelineDetails.useParams();

  return useApplicationWatchList({
    labels: {
      [applicationLabels.pipeline]: params.name,
    },
    namespace: params.namespace,
  });
};
