import { useConfigMapWatchItem } from "..";

export const useWatchVariablesConfig = (stageMetadataName: string, namespace: string) => {
  return useConfigMapWatchItem({
    name: stageMetadataName,
    namespace,
  });
};
