import React from "react";
import { useWatchGitOpsCodebase } from "@/k8s/api/groups/KRCI/Codebase/hooks/useWatchGitOpsCodebase";
import { useQuickLinkWatchURLs } from "@/k8s/api/groups/KRCI/QuickLink/hooks/useQuickLinksUrlListQuery";
import { useWatchStagePipelineRuns } from "@/k8s/api/groups/Tekton/PipelineRun";
import {
  Application,
  applicationLabels,
  Codebase,
  CodebaseImageStream,
  codebaseLabels,
  codebaseType,
  PipelineRun,
  Stage,
  TriggerTemplate,
} from "@my-project/shared";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useStageWatchItem, useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useApplicationWatchList } from "@/k8s/api/groups/ArgoCD/Application";
import { useQuery } from "@tanstack/react-query";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useCodebaseImageStreamWatchList } from "@/k8s/api/groups/KRCI/CodebaseImageStream";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { useConfigMapWatchItem } from "@/k8s/api/groups/Core/ConfigMap";
import { useTriggerTemplateWatchItem } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { routeStageDetails } from "../route";

export const useWatchApplicationsPods = () => true; // noop

export const useCDPipelineWatch = () => {
  const params = routeStageDetails.useParams();

  return useCDPipelineWatchItem({
    name: params.cdPipeline,
    namespace: params.namespace,
  });
};

export const useStageWatch = () => {
  const params = routeStageDetails.useParams();

  return useStageWatchItem({
    name: `${params.cdPipeline}-${params.stage}`,
    namespace: params.namespace,
  });
};

export const useStageListWatch = () => {
  const params = routeStageDetails.useParams();

  return useStageWatchList({
    namespace: params.namespace,
  });
};

export const usePipelineRunsWatch = () => {
  const params = routeStageDetails.useParams();

  return useWatchStagePipelineRuns(params.stage, params.cdPipeline, params.namespace);
};

export const useApplicationsWatch = () => {
  const params = routeStageDetails.useParams();

  return useApplicationWatchList({
    namespace: params.namespace,
    labels: {
      [applicationLabels.pipeline]: params.cdPipeline,
      [applicationLabels.stage]: params.stage,
    },
  });
};

export const useQuickLinksUrlListWatch = () => {
  const params = routeStageDetails.useParams();

  return useQuickLinkWatchURLs(params.namespace);
};

export const useGitOpsCodebaseWatch = () => {
  const params = routeStageDetails.useParams();

  return useWatchGitOpsCodebase(params.namespace);
};

export const useGitServersWatch = () => {
  const params = routeStageDetails.useParams();

  return useGitServerWatchList({
    namespace: params.namespace,
  });
};

export const useVariablesConfigMapWatch = () => {
  const params = routeStageDetails.useParams();

  return useConfigMapWatchItem({
    name: `${params.cdPipeline}-${params.stage}`,
    namespace: params.namespace,
  });
};

const useWatchStageTriggerTemplatePipelineRun = (triggerTemplateName: string | undefined, namespace: string) => {
  const triggerTemplateWatch = useTriggerTemplateWatchItem({
    name: triggerTemplateName,
    namespace,
  });

  return useQuery<TriggerTemplate, Error, PipelineRun>({
    queryKey: ["stageTriggerTemplatePipelineRun", triggerTemplateWatch.resourceVersion],
    queryFn: () => {
      return triggerTemplateWatch.query.data?.spec.resourcetemplates?.[0] as PipelineRun;
    },
    enabled: !!triggerTemplateWatch.query.isSuccess,
  });
};

export const useCleanPipelineRunTemplateWatch = () => {
  const params = routeStageDetails.useParams();
  const stageWatch = useStageWatch();

  return useWatchStageTriggerTemplatePipelineRun(stageWatch.query.data?.spec.cleanTemplate, params.namespace);
};

export const useDeployPipelineRunTemplateWatch = () => {
  const params = routeStageDetails.useParams();
  const stageWatch = useStageWatch();

  return useWatchStageTriggerTemplatePipelineRun(stageWatch.query.data?.spec.triggerTemplate, params.namespace);
};

export const useCodebasesWatch = () => {
  const params = routeStageDetails.useParams();

  return useCodebaseWatchList({
    namespace: params.namespace,
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.application,
    },
  });
};

export const useCodebaseImageStreamsWatch = () => {
  const params = routeStageDetails.useParams();

  return useCodebaseImageStreamWatchList({
    namespace: params.namespace,
  });
};

/**
 * Returns app codebases filtered to only those in the current pipeline.
 * Simpler hook that doesn't wait for all data sources.
 */
export const usePipelineAppCodebasesWatch = () => {
  const cdPipelineWatch = useCDPipelineWatch();
  const appCodebaseListWatch = useCodebasesWatch();

  const pipelineAppCodebases = appCodebaseListWatch.data.array.filter((appCodebase) =>
    cdPipelineWatch.data?.spec.applications.some((appName) => appName === appCodebase.metadata.name)
  );

  return {
    data: pipelineAppCodebases,
    isLoading: cdPipelineWatch.isLoading || appCodebaseListWatch.isLoading,
    isReady: cdPipelineWatch.isReady && appCodebaseListWatch.isReady,
  };
};

/**
 * Creates a Map of Argo applications by app name for quick lookups.
 */
export const createArgoApplicationsByNameMap = (applications: Application[]): Map<string, Application> => {
  const map = new Map<string, Application>();
  for (const app of applications) {
    const appName = app.metadata?.labels?.[applicationLabels.appName];
    if (appName) {
      map.set(appName, app);
    }
  }
  return map;
};

export interface StageAppCodebaseCombinedData {
  appCodebase: Codebase;
  appCodebaseImageStream: CodebaseImageStream | undefined;
  appCodebaseImageStreamList: CodebaseImageStream[];
  appCodebaseVerifiedImageStream: CodebaseImageStream | undefined;
  application: Application | undefined;
  toPromote: boolean;
}

export interface StageAppCodebasesCombinedDataResult {
  appCodebaseList: Codebase[];
  stageAppCodebasesCombinedData: StageAppCodebaseCombinedData[];
  stageAppCodebasesCombinedDataByApplicationName: Map<string, StageAppCodebaseCombinedData>;
  isLoading: boolean;
  isReady: boolean;
}

const findPreviousStage = (stages: Stage[], currentStageOrder: number): Stage | undefined => {
  return stages.find(({ spec: { order: stageOrder } }) => stageOrder === currentStageOrder - 1);
};

const createDockerStreamSet = (inputDockerStreams: string[] = []): Set<string> => {
  const normalizedNames = inputDockerStreams.map((el) => el.replaceAll(".", "-"));
  return new Set<string>(normalizedNames);
};

const createAppToPromoteSet = (applicationsToPromote: string[] | null = []): Set<string> => {
  const normalizedNames = applicationsToPromote?.map((el) => el.replaceAll(".", "-")) || [];
  return new Set<string>(normalizedNames);
};

const getImageStreamByStageOrder = (
  imageStreams: CodebaseImageStream[],
  order: number,
  inputDockerStreamsSet: Set<string>,
  stages: Stage[],
  cdPipelineName: string
): CodebaseImageStream | undefined => {
  if (order === 0) {
    return imageStreams.find((el) => inputDockerStreamsSet.has(el.metadata.name));
  }

  const previousStage = findPreviousStage(stages, order);
  if (!previousStage) {
    return undefined;
  }

  return imageStreams.find(
    ({ spec: { codebase }, metadata: { name } }) =>
      name === `${cdPipelineName}-${previousStage.spec.name}-${codebase}-verified`
  );
};

const getImageStreamByToPromoteFlag = (
  imageStreams: CodebaseImageStream[],
  inputDockerStreamsSet: Set<string>
): CodebaseImageStream | undefined => {
  return imageStreams.find((el) => inputDockerStreamsSet.has(el.metadata.name));
};

const getVerifiedImageStream = (
  imageStreams: CodebaseImageStream[],
  cdPipelineName: string,
  stageName: string,
  codebase: string
): CodebaseImageStream | undefined => {
  return imageStreams.find(({ metadata: { name } }) => name === `${cdPipelineName}-${stageName}-${codebase}-verified`);
};

const findArgoApplicationByCodebaseName = (
  argoApplications: Application[],
  appName: string
): Application | undefined => {
  return argoApplications.find(
    (argoApplication) => argoApplication.metadata?.labels?.[applicationLabels.appName] === appName
  );
};

const processAppCodebase = (
  appCodebase: Codebase,
  {
    cdPipelineApplicationToPromoteListSet,
    cdPipelineAppsToPromoteSet,
    cdPipelineInputDockerStreamsSet,
    imageStreams,
    argoApplications,
    stages,
    stageOrder,
    cdPipelineName,
    stageName,
  }: {
    cdPipelineApplicationToPromoteListSet: Set<string>;
    cdPipelineAppsToPromoteSet: Set<string>;
    cdPipelineInputDockerStreamsSet: Set<string>;
    imageStreams: CodebaseImageStream[];
    argoApplications: Application[];
    stages: Stage[];
    stageOrder: number;
    cdPipelineName: string;
    stageName: string;
  }
): StageAppCodebaseCombinedData => {
  const appName = appCodebase.metadata.name;

  const appCodebaseImageStreamList = imageStreams.filter(({ spec: { codebase } }) => codebase === appName);

  const isPromote = cdPipelineAppsToPromoteSet.has(appName);

  const appCodebaseVerifiedImageStream = getVerifiedImageStream(
    appCodebaseImageStreamList,
    cdPipelineName,
    stageName,
    appName
  );

  const application = findArgoApplicationByCodebaseName(argoApplications, appName);

  const appCodebaseImageStream = isPromote
    ? getImageStreamByStageOrder(
        appCodebaseImageStreamList,
        stageOrder,
        cdPipelineInputDockerStreamsSet,
        stages,
        cdPipelineName
      )
    : getImageStreamByToPromoteFlag(appCodebaseImageStreamList, cdPipelineInputDockerStreamsSet);

  return {
    appCodebase,
    appCodebaseImageStream,
    appCodebaseImageStreamList,
    appCodebaseVerifiedImageStream,
    application,
    toPromote: cdPipelineApplicationToPromoteListSet.has(appName),
  };
};

/**
 * Composes stage app codebases with their related data (image streams, argo apps) at render time.
 * This hook does NOT use useQuery - it composes data immediately as each watch updates.
 * This eliminates the flickering caused by waiting for all watches to complete.
 */
export const useStageAppCodebasesCombinedData = (): StageAppCodebasesCombinedDataResult => {
  const params = routeStageDetails.useParams();

  const cdPipelineWatch = useCDPipelineWatch();
  const stageWatch = useStageWatch();
  const stageListWatch = useStageListWatch();
  const appCodebaseListWatch = useCodebasesWatch();
  const codebaseImageStreamListWatch = useCodebaseImageStreamsWatch();
  const argoApplicationListWatch = useApplicationsWatch();

  const isLoading =
    cdPipelineWatch.isLoading ||
    stageWatch.isLoading ||
    stageListWatch.isLoading ||
    appCodebaseListWatch.isLoading ||
    codebaseImageStreamListWatch.isLoading ||
    argoApplicationListWatch.isLoading;

  const isReady =
    cdPipelineWatch.isReady &&
    stageWatch.isReady &&
    stageListWatch.isReady &&
    appCodebaseListWatch.isReady &&
    codebaseImageStreamListWatch.isReady &&
    argoApplicationListWatch.isReady;

  // Compose data at render time using useMemo
  const result = React.useMemo((): Omit<StageAppCodebasesCombinedDataResult, "isLoading" | "isReady"> => {
    const cdPipeline = cdPipelineWatch.data;
    const stageData = stageWatch.data;

    // Return empty state if core data is not available
    if (!cdPipeline || !stageData) {
      return {
        appCodebaseList: [],
        stageAppCodebasesCombinedData: [],
        stageAppCodebasesCombinedDataByApplicationName: new Map(),
      };
    }

    const stageAppCodebaseList = appCodebaseListWatch.data.array.filter((appCodebase: Codebase) =>
      cdPipeline.spec.applications.some((cdPipelineApp: string) => cdPipelineApp === appCodebase.metadata.name)
    );

    const cdPipelineApplicationToPromoteListSet = new Set<string>(cdPipeline.spec.applicationsToPromote ?? []);
    const cdPipelineAppsToPromoteSet = createAppToPromoteSet(cdPipeline.spec.applicationsToPromote ?? null);
    const cdPipelineInputDockerStreamsSet = createDockerStreamSet(cdPipeline.spec.inputDockerStreams);

    const stageAppCodebasesCombinedData = stageAppCodebaseList.map((appCodebase: Codebase) =>
      processAppCodebase(appCodebase, {
        cdPipelineApplicationToPromoteListSet,
        cdPipelineAppsToPromoteSet,
        cdPipelineInputDockerStreamsSet,
        imageStreams: codebaseImageStreamListWatch.data.array,
        argoApplications: argoApplicationListWatch.data.array,
        stages: stageListWatch.data.array,
        stageOrder: stageData.spec.order,
        cdPipelineName: params.cdPipeline,
        stageName: params.stage,
      })
    );

    return {
      appCodebaseList: stageAppCodebaseList,
      stageAppCodebasesCombinedData,
      stageAppCodebasesCombinedDataByApplicationName: new Map(
        stageAppCodebasesCombinedData.map((el: StageAppCodebaseCombinedData) => [el.appCodebase.metadata.name, el])
      ),
    };
  }, [
    cdPipelineWatch.data,
    stageWatch.data,
    stageListWatch.data.array,
    appCodebaseListWatch.data.array,
    codebaseImageStreamListWatch.data.array,
    argoApplicationListWatch.data.array,
    params.cdPipeline,
    params.stage,
  ]);

  return {
    ...result,
    isLoading,
    isReady,
  };
};

/**
 * @deprecated Use useStageAppCodebasesCombinedData instead. This hook is kept for backward compatibility.
 */
export const useWatchStageAppCodebasesCombinedData = () => {
  const result = useStageAppCodebasesCombinedData();

  // Provide backward compatible interface
  return {
    data: result.stageAppCodebasesCombinedData.length > 0 ? result : undefined,
    isLoading: result.isLoading,
    isFetched: result.isReady,
  };
};
