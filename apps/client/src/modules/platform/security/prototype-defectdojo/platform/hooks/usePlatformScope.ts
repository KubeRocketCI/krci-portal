// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { applicationLabels } from "@my-project/shared";
import { useApplicationWatchList } from "@/k8s/api/groups/ArgoCD/Application";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useClusterStore } from "@/k8s/store";
import type { PlatformScope } from "../types";

/** Kubernetes side of the joins of the Security pages: Stages, Applications and Codebases of the installation namespace. */
export function usePlatformScope(): { scope: PlatformScope; isLoading: boolean } {
  const portalClusterName = useClusterStore((state) => state.clusterName);
  const installationNamespace = useClusterStore((state) => state.defaultNamespace);

  const stageListWatch = useStageWatchList({ namespace: installationNamespace });
  const applicationListWatch = useApplicationWatchList({ namespace: installationNamespace });
  const codebaseListWatch = useCodebaseWatchList({ namespace: installationNamespace });

  const stageList = stageListWatch.data.array;
  const applicationList = applicationListWatch.data.array;
  const codebaseList = codebaseListWatch.data.array;

  const scope = React.useMemo<PlatformScope>(
    () => ({
      portalClusterName,
      installationNamespace,
      stages: stageList.map((stage) => ({
        cdPipeline: stage.spec.cdPipeline,
        stage: stage.spec.name,
        clusterName: stage.spec.clusterName,
        namespace: stage.spec.namespace,
      })),
      applications: applicationList.flatMap((application) => {
        const labels = application.metadata.labels ?? {};
        const codebaseName = labels[applicationLabels.appName];
        const cdPipeline = labels[applicationLabels.pipeline];
        const stage = labels[applicationLabels.stage];
        return codebaseName && cdPipeline && stage
          ? [{ applicationName: application.metadata.name, codebaseName, cdPipeline, stage }]
          : [];
      }),
      codebases: codebaseList.map((codebase) => codebase.metadata.name),
    }),
    [portalClusterName, installationNamespace, stageList, applicationList, codebaseList]
  );

  return {
    scope,
    isLoading: stageListWatch.isLoading || applicationListWatch.isLoading || codebaseListWatch.isLoading,
  };
}
