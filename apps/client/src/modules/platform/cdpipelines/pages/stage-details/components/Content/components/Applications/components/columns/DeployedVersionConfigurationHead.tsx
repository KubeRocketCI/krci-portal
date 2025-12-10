import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";
import { checkHighlightedButtons } from "../../utils/checkHighlightedButtons";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import React from "react";
import { IMAGE_TAG_POSTFIX } from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import {
  usePipelineAppCodebasesWatch,
  useCodebaseImageStreamsWatch,
  useCDPipelineWatch,
  useStageWatch,
  useStageListWatch,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { CodebaseImageStream, Stage } from "@my-project/shared";

// Helper functions for image stream lookups
const findPreviousStage = (stages: Stage[], currentStageOrder: number): Stage | undefined => {
  return stages.find(({ spec: { order: stageOrder } }) => stageOrder === currentStageOrder - 1);
};

const createDockerStreamSet = (inputDockerStreams: string[] = []): Set<string> => {
  const normalizedNames = inputDockerStreams.map((el) => el.replaceAll(".", "-"));
  return new Set<string>(normalizedNames);
};

const getLatestImageStream = (
  imageStreams: CodebaseImageStream[],
  codebaseName: string,
  stageOrder: number,
  inputDockerStreamsSet: Set<string>,
  stages: Stage[],
  cdPipelineName: string,
  applicationsToPromote: string[] | null
): CodebaseImageStream | undefined => {
  const codebaseImageStreams = imageStreams.filter(({ spec: { codebase } }) => codebase === codebaseName);
  const normalizedAppsToPromote = new Set(applicationsToPromote?.map((el) => el.replaceAll(".", "-")) || []);
  const isPromote = normalizedAppsToPromote.has(codebaseName);

  if (isPromote) {
    if (stageOrder === 0) {
      return codebaseImageStreams.find((el) => inputDockerStreamsSet.has(el.metadata.name));
    }
    const previousStage = findPreviousStage(stages, stageOrder);
    if (!previousStage) return undefined;
    return codebaseImageStreams.find(
      ({ spec: { codebase }, metadata: { name } }) =>
        name === `${cdPipelineName}-${previousStage.spec.name}-${codebase}-verified`
    );
  }

  return codebaseImageStreams.find((el) => inputDockerStreamsSet.has(el.metadata.name));
};

const getVerifiedImageStream = (
  imageStreams: CodebaseImageStream[],
  cdPipelineName: string,
  stageName: string,
  codebaseName: string
): CodebaseImageStream | undefined => {
  return imageStreams.find(
    ({ metadata: { name } }) => name === `${cdPipelineName}-${stageName}-${codebaseName}-verified`
  );
};

export const DeployedVersionConfigurationHeadColumn = () => {
  const params = routeStageDetails.useParams();
  const cdPipelineWatch = useCDPipelineWatch();
  const stageWatch = useStageWatch();
  const stageListWatch = useStageListWatch();
  const pipelineAppCodebasesWatch = usePipelineAppCodebasesWatch();
  const imageStreamsWatch = useCodebaseImageStreamsWatch();

  const { watch, setValue, resetField } = useTypedFormContext();
  const values = watch();
  const buttonsHighlighted = checkHighlightedButtons(values);

  const isLoading =
    pipelineAppCodebasesWatch.isLoading ||
    imageStreamsWatch.isLoading ||
    cdPipelineWatch.isLoading ||
    stageWatch.isLoading ||
    stageListWatch.isLoading;

  const handleClickLatest = React.useCallback(() => {
    if (isLoading || !cdPipelineWatch.data || !stageWatch.data) {
      return;
    }

    const inputDockerStreamsSet = createDockerStreamSet(cdPipelineWatch.data.spec.inputDockerStreams);

    for (const appCodebase of pipelineAppCodebasesWatch.data) {
      const appName = appCodebase.metadata.name;
      const selectFieldName = `${appName}${IMAGE_TAG_POSTFIX}` as const;
      resetField(selectFieldName);

      const latestImageStream = getLatestImageStream(
        imageStreamsWatch.data.array,
        appName,
        stageWatch.data.spec.order,
        inputDockerStreamsSet,
        stageListWatch.data.array,
        params.cdPipeline,
        cdPipelineWatch.data.spec.applicationsToPromote ?? null
      );

      if (!latestImageStream?.spec?.tags?.length) {
        continue;
      }

      const imageStreamTag = latestImageStream.spec.tags.at(-1)?.name;
      if (!imageStreamTag) continue;

      setValue(selectFieldName, `latest::${imageStreamTag}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [
    isLoading,
    cdPipelineWatch.data,
    stageWatch.data,
    pipelineAppCodebasesWatch.data,
    imageStreamsWatch.data.array,
    stageListWatch.data.array,
    params.cdPipeline,
    resetField,
    setValue,
  ]);

  const handleClickStable = React.useCallback(() => {
    if (isLoading || !stageWatch.data) {
      return;
    }

    for (const appCodebase of pipelineAppCodebasesWatch.data) {
      const appName = appCodebase.metadata.name;
      const selectFieldName = `${appName}${IMAGE_TAG_POSTFIX}` as const;
      resetField(selectFieldName);

      const verifiedImageStream = getVerifiedImageStream(
        imageStreamsWatch.data.array,
        params.cdPipeline,
        params.stage,
        appName
      );

      if (!verifiedImageStream?.spec?.tags?.length) {
        continue;
      }

      const imageStreamTag = verifiedImageStream.spec.tags.at(-1)?.name;
      if (!imageStreamTag) continue;

      setValue(selectFieldName, `stable::${imageStreamTag}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [
    isLoading,
    stageWatch.data,
    pipelineAppCodebasesWatch.data,
    imageStreamsWatch.data.array,
    params.cdPipeline,
    params.stage,
    resetField,
    setValue,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        <Tooltip title={"Set selected applications latest image stream version"}>
          <Button
            onClick={handleClickLatest}
            variant={buttonsHighlighted.latest ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            latest
          </Button>
        </Tooltip>
        <Tooltip title={"Set selected applications stable image stream version"}>
          <Button
            onClick={handleClickStable}
            variant={buttonsHighlighted.stable ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            stable
          </Button>
        </Tooltip>
      </div>
      <div className="flex flex-row flex-nowrap items-center gap-2">
        <div>Deployed version</div>
        <Tooltip
          title={
            <>
              <p className="text-sm">Choose the application image version to deploy.</p>
              <div className="text-sm">
                This field is enabled after a successful build and promotion through previous Environments, if any.
              </div>
            </>
          }
          className="leading-none"
        >
          <Info size={16} />
        </Tooltip>
      </div>
    </div>
  );
};
