import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";
import { checkHighlightedButtons } from "../../utils/checkHighlightedButtons";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { useStore } from "@tanstack/react-form";
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

export const DeployedVersionConfigurationHeadColumn = () => {
  const params = routeStageDetails.useParams();
  const cdPipelineWatch = useCDPipelineWatch();
  const stageWatch = useStageWatch();
  const stageListWatch = useStageListWatch();
  const pipelineAppCodebasesWatch = usePipelineAppCodebasesWatch();
  const imageStreamsWatch = useCodebaseImageStreamsWatch();

  const form = useTypedFormContext();

  // Subscribe to form state changes using useStore to ensure re-renders when values change
  const stateValues = useStore(form.store, (state) => state.values);

  // Merge state.values and defaultValues to handle pagination (fields not yet rendered)
  const values = React.useMemo(() => {
    const defaultValues = form.options.defaultValues || {};
    return { ...defaultValues, ...stateValues };
  }, [stateValues, form.options.defaultValues]);

  const buttonsHighlighted = checkHighlightedButtons(values);

  const isLoading =
    pipelineAppCodebasesWatch.isLoading ||
    imageStreamsWatch.isLoading ||
    cdPipelineWatch.isLoading ||
    stageWatch.isLoading ||
    stageListWatch.isLoading;

  // Helper functions for image stream lookups wrapped in useCallback to prevent recreating on every render
  const findPreviousStage = React.useCallback((stages: Stage[], currentStageOrder: number): Stage | undefined => {
    return stages.find(({ spec: { order: stageOrder } }) => stageOrder === currentStageOrder - 1);
  }, []);

  const createDockerStreamSet = React.useCallback((inputDockerStreams: string[] = []): Set<string> => {
    const normalizedNames = inputDockerStreams.map((el) => el.replaceAll(".", "-"));
    return new Set<string>(normalizedNames);
  }, []);

  const getLatestImageStream = React.useCallback(
    (
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
    },
    [findPreviousStage]
  );

  const getVerifiedImageStream = React.useCallback(
    (
      imageStreams: CodebaseImageStream[],
      cdPipelineName: string,
      stageName: string,
      codebaseName: string
    ): CodebaseImageStream | undefined => {
      return imageStreams.find(
        ({ metadata: { name } }) => name === `${cdPipelineName}-${stageName}-${codebaseName}-verified`
      );
    },
    []
  );

  const handleClickLatest = React.useCallback(() => {
    if (isLoading || !cdPipelineWatch.data || !stageWatch.data) {
      return;
    }

    const inputDockerStreamsSet = createDockerStreamSet(cdPipelineWatch.data.spec.inputDockerStreams);

    // Get all image tag field names from both state.values and defaultValues
    const stateKeys = Object.keys(form.state.values).filter((key) => key.includes(IMAGE_TAG_POSTFIX));
    const defaultKeys = Object.keys(form.options.defaultValues || {}).filter((key) => key.includes(IMAGE_TAG_POSTFIX));
    const allImageTagFields = Array.from(new Set([...stateKeys, ...defaultKeys]));

    // Process all image tag fields to set their latest values
    for (const fieldName of allImageTagFields) {
      // Extract app name from field name (remove IMAGE_TAG_POSTFIX)
      const appName = fieldName.replace(IMAGE_TAG_POSTFIX, "");

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

      const newValue = `latest::${imageStreamTag}`;

      // Set field value with dontRunListeners to prevent form-level onChange conflicts
      form.setFieldValue(fieldName as keyof typeof form.state.values, newValue, {
        dontRunListeners: true,
        dontValidate: true,
      });
    }
  }, [
    isLoading,
    cdPipelineWatch.data,
    stageWatch.data,
    imageStreamsWatch.data.array,
    stageListWatch.data.array,
    params.cdPipeline,
    form,
    createDockerStreamSet,
    getLatestImageStream,
  ]);

  const handleClickStable = React.useCallback(() => {
    if (isLoading || !stageWatch.data) {
      return;
    }

    // Get all image tag field names from both state.values and defaultValues
    const stateKeys = Object.keys(form.state.values).filter((key) => key.includes(IMAGE_TAG_POSTFIX));
    const defaultKeys = Object.keys(form.options.defaultValues || {}).filter((key) => key.includes(IMAGE_TAG_POSTFIX));
    const allImageTagFields = Array.from(new Set([...stateKeys, ...defaultKeys]));

    // Process all image tag fields to set their stable values
    for (const fieldName of allImageTagFields) {
      // Extract app name from field name (remove IMAGE_TAG_POSTFIX)
      const appName = fieldName.replace(IMAGE_TAG_POSTFIX, "");

      const verifiedImageStream = getVerifiedImageStream(
        imageStreamsWatch.data.array,
        params.cdPipeline,
        params.stage,
        appName
      );

      // If no stable version available, set to undefined
      if (!verifiedImageStream?.spec?.tags?.length) {
        form.setFieldValue(fieldName as keyof typeof form.state.values, undefined as unknown as string, {
          dontRunListeners: true,
          dontValidate: true,
        });
        continue;
      }

      const imageStreamTag = verifiedImageStream.spec.tags.at(-1)?.name;
      if (!imageStreamTag) {
        // If no tag name, set to undefined
        form.setFieldValue(fieldName as keyof typeof form.state.values, undefined as unknown as string, {
          dontRunListeners: true,
          dontValidate: true,
        });
        continue;
      }

      // Set field value with dontRunListeners to prevent form-level onChange conflicts
      form.setFieldValue(fieldName as keyof typeof form.state.values, `stable::${imageStreamTag}`, {
        dontRunListeners: true,
        dontValidate: true,
      });
    }
  }, [
    isLoading,
    stageWatch.data,
    imageStreamsWatch.data.array,
    params.cdPipeline,
    params.stage,
    form,
    getVerifiedImageStream,
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
