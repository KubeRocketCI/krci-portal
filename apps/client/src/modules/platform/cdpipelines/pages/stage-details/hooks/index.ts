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
import { useConfigMapWatchItem } from "@/k8s/api/groups/core/ConfigMap";
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

export interface StageAppCodebaseCombinedData {
  appCodebase: Codebase;
  appCodebaseImageStream: CodebaseImageStream | undefined;
  appCodebaseImageStreamList: CodebaseImageStream[];
  appCodebaseVerifiedImageStream: CodebaseImageStream | undefined;
  application: Application | undefined;
  toPromote: boolean;
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

export const useWatchStageAppCodebasesCombinedData = () => {
  const params = routeStageDetails.useParams();

  const cdPipelineWatch = useCDPipelineWatch();
  const stageWatch = useStageWatch();
  const stageListWatch = useStageListWatch();
  const appCodebaseListWatch = useCodebasesWatch();
  const codebaseImageStreamListWatch = useCodebaseImageStreamsWatch();
  const argoApplicationListWatch = useApplicationsWatch();

  console.log(argoApplicationListWatch);

  return useQuery({
    queryKey: [
      "appCodebaseListWithImageStreamsAndArgoApps",
      cdPipelineWatch.resourceVersion,
      stageWatch.resourceVersion,
      stageListWatch.resourceVersion,
      appCodebaseListWatch.resourceVersion,
      codebaseImageStreamListWatch.resourceVersion,
      argoApplicationListWatch.resourceVersion,
    ],
    queryFn: () => {
      const cdPipeline = cdPipelineWatch.query.data!;
      const stageData = stageWatch.query.data!;

      const stageAppCodebaseList = appCodebaseListWatch.dataArray.filter((appCodebase: Codebase) =>
        cdPipeline.spec.applications.some((cdPipelineApp: string) => cdPipelineApp === appCodebase.metadata.name)
      );

      const cdPipelineApplicationToPromoteListSet = new Set<string>(cdPipeline.spec.applicationsToPromote);
      const cdPipelineAppsToPromoteSet = createAppToPromoteSet(cdPipeline.spec.applicationsToPromote);
      const cdPipelineInputDockerStreamsSet = createDockerStreamSet(cdPipeline.spec.inputDockerStreams);

      const stageAppCodebasesCombinedData = stageAppCodebaseList.map((appCodebase: Codebase) =>
        processAppCodebase(appCodebase, {
          cdPipelineApplicationToPromoteListSet,
          cdPipelineAppsToPromoteSet,
          cdPipelineInputDockerStreamsSet,
          imageStreams: codebaseImageStreamListWatch.dataArray,
          argoApplications: argoApplicationListWatch.dataArray,
          stages: stageListWatch.dataArray,
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
    },
    enabled:
      cdPipelineWatch.query.isSuccess &&
      stageWatch.query.isSuccess &&
      stageListWatch.query.isSuccess &&
      appCodebaseListWatch.query.isSuccess &&
      codebaseImageStreamListWatch.query.isSuccess &&
      argoApplicationListWatch.query.isSuccess,
  });
};
