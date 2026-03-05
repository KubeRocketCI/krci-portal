import { useMemo } from "react";
import { applicationLabels, Application } from "@my-project/shared";
import { useCDPipelineWatch, useAppCodebaseListWatch, useStageListWatch } from "./data";

export const usePipelineAppCodebases = () => {
  const cdPipelineWatch = useCDPipelineWatch();
  const appCodebaseListWatch = useAppCodebaseListWatch();

  const data = useMemo(() => {
    const cdPipeline = cdPipelineWatch.data;
    if (!cdPipeline) return [];

    return appCodebaseListWatch.data.array.filter((appCodebase) =>
      cdPipeline.spec.applications.some((appName) => appName === appCodebase.metadata.name)
    );
  }, [cdPipelineWatch.data, appCodebaseListWatch.data.array]);

  return {
    data,
    isLoading: cdPipelineWatch.isLoading || appCodebaseListWatch.isLoading,
  };
};

export const useArgoAppsByAppName = (argoApps: Application[]) => {
  return useMemo(() => {
    const map = new Map<string, Application>();
    for (const app of argoApps) {
      const appName = app.metadata?.labels?.[applicationLabels.appName];
      if (appName) {
        map.set(appName, app);
      }
    }
    return map;
  }, [argoApps]);
};

export const useSortedStages = () => {
  const stageListWatch = useStageListWatch();

  const data = useMemo(() => {
    return stageListWatch.data.array.toSorted((a, b) => a.spec.order - b.spec.order);
  }, [stageListWatch.data.array]);

  return {
    data,
    isLoading: stageListWatch.isLoading,
  };
};
