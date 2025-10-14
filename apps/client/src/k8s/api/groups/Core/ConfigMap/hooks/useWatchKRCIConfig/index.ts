import { ConfigMap, krciConfigMapNames } from "@my-project/shared";
import { ValueOf } from "@my-project/shared/types";
import { useQuery } from "@tanstack/react-query";
import { useConfigMapWatchList } from "..";
import { RequestError } from "@/core/types/global";

export const useWatchKRCIConfig = () => {
  const configMapListWatch = useConfigMapWatchList();

  const configMapList = configMapListWatch.dataArray;

  return useQuery<ConfigMap | undefined, RequestError>({
    queryKey: ["krciConfigMap", configMapListWatch.resourceVersion],
    queryFn: () => {
      return configMapList.find((configMap) =>
        Object.values(krciConfigMapNames).includes(configMap.metadata.name as ValueOf<typeof krciConfigMapNames>)
      );
    },
    enabled: configMapListWatch.isReady,
  });
};
