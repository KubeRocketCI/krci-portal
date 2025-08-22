import { applicationLabels, codebaseLabels, codebaseType, stageLabels } from "@my-project/shared";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { routeCDPipelineDetails } from "../route";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useApplicationWatchList } from "@/k8s/api/groups/ArgoCD/Application";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { combineStageWithApplications } from "@/k8s/api/groups/KRCI/Stage/utils/combineStageWithApplications";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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

export const useStagesWithItsApplicationsWatch = () => {
  const params = routeCDPipelineDetails.useParams();

  const cdPipelineWatch = useCDPipelineWatch();

  const stageListWatch = useStageWatchList({
    labels: {
      [stageLabels.cdPipeline]: params.name,
    },
    namespace: params.namespace,
  });

  console.log(stageListWatch);

  const appCodebaseListWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.application,
    },
    namespace: params.namespace,
  });

  const applicationListWatch = useApplicationWatchList({
    labels: {
      [applicationLabels.pipeline]: params.name,
    },
    namespace: params.namespace,
  });

  return useQuery({
    queryKey: [
      "stageListWithApplications",
      stageListWatch.resourceVersion,
      appCodebaseListWatch.resourceVersion,
      applicationListWatch.resourceVersion,
    ],
    queryFn: () => {
      const cdPipeline = cdPipelineWatch.query.data;
      const stageAppCodebaseList = appCodebaseListWatch.dataArray.filter((appCodebase) =>
        cdPipeline?.spec.applications.some((cdPipelineApp) => cdPipelineApp === appCodebase.metadata.name)
      );
      const sortedStageList = stageListWatch.dataArray.toSorted((a, b) => a.spec.order - b.spec.order);

      console.log(sortedStageList);

      return {
        stages: sortedStageList,
        stagesWithItsApplications: combineStageWithApplications(
          applicationListWatch.dataArray,
          stageAppCodebaseList,
          sortedStageList
        ),
      };
    },
    placeholderData: keepPreviousData,
    enabled:
      stageListWatch.query.isSuccess && appCodebaseListWatch.query.isSuccess && applicationListWatch.query.isSuccess,
  });
};
