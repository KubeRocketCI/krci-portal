import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useQuery } from "@tanstack/react-query";

export const useConflictedStageWatch = (clusterName: string | undefined) => {
  const stageListWatch = useStageWatchList();

  return useQuery({
    queryKey: ["conflicted-stage", clusterName],
    queryFn: () => {
      return stageListWatch.data.array.find((item) => {
        return item.spec.clusterName === clusterName;
      });
    },
    enabled: stageListWatch.isReady,
  });
};
