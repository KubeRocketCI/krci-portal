import { applicationLabels, codebaseLabels, codebaseType, stageLabels } from "@my-project/shared";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { routeCDPipelineDetails } from "../route";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useApplicationWatchList } from "@/k8s/api/groups/ArgoCD/Application";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
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
