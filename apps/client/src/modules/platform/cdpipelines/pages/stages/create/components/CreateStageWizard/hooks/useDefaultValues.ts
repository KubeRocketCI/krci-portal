import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useClusterStore } from "@/k8s/store";
import {
  inClusterName,
  pipelineType,
  stageLabels,
  stageTriggerType,
  stageQualityGateType,
  triggerTemplateLabels,
} from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { v4 as uuidv4 } from "uuid";
import { NAMES } from "../names";
import { routeStageCreate } from "../../../route";

const defaultQualityGate = {
  id: uuidv4(),
  qualityGateType: stageQualityGateType.manual,
  stepName: "approve",
  autotestName: null,
  branchName: null,
};

export const useDefaultValues = () => {
  // Safely get route params - fallback to empty object if route is not active (e.g., in Storybook)
  let routeParams: { namespace?: string; cdPipeline?: string } = {};
  try {
    routeParams = routeStageCreate.useParams();
  } catch {
    // Route not active - use empty params
  }
  const { namespace, cdPipeline: cdPipelineName } = routeParams;

  const { defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const effectiveNamespace = namespace || defaultNamespace;

  const stagesWatch = useStageWatchList({
    namespace: effectiveNamespace,
    labels: {
      [stageLabels.cdPipeline]: cdPipelineName ?? "",
    },
    queryOptions: {
      enabled: !!cdPipelineName && !!effectiveNamespace,
    },
  });

  const stagesQuantity = stagesWatch.data.array.length;

  const triggerTemplateListWatch = useTriggerTemplateWatchList();
  const triggerTemplateList = triggerTemplateListWatch.data.array;

  const deployTriggerTemplate = triggerTemplateList.find(
    (el) => el.metadata.labels?.[triggerTemplateLabels.pipelineType] === pipelineType.deploy
  );
  const cleanTriggerTemplate = triggerTemplateList.find(
    (el) => el.metadata.labels?.[triggerTemplateLabels.pipelineType] === pipelineType.clean
  );

  return React.useMemo(
    () => ({
      [NAMES.order]: stagesQuantity,
      [NAMES.triggerType]: stageTriggerType.Manual,
      [NAMES.sourceLibraryName]: "default",
      [NAMES.sourceType]: "default",
      [NAMES.sourceLibraryBranch]: "default",
      [NAMES.cluster]: inClusterName,
      [NAMES.qualityGates]: [defaultQualityGate],
      [NAMES.deployNamespace]: `${effectiveNamespace}-${cdPipelineName}`,
      [NAMES.triggerTemplate]: deployTriggerTemplate?.metadata.name || "",
      [NAMES.cleanTemplate]: cleanTriggerTemplate?.metadata.name || "",
      [NAMES.cdPipeline]: cdPipelineName,
      [NAMES.namespace]: effectiveNamespace,
      [NAMES.name]: "",
      [NAMES.description]: "",
    }),
    [cdPipelineName, cleanTriggerTemplate, deployTriggerTemplate, effectiveNamespace, stagesQuantity]
  );
};

export const useCDPipelineData = () => {
  // Safely get route params - fallback to empty object if route is not active (e.g., in Storybook)
  let routeParams: { namespace?: string; cdPipeline?: string } = {};
  try {
    routeParams = routeStageCreate.useParams();
  } catch {
    // Route not active - use empty params
  }
  const { namespace, cdPipeline: cdPipelineName } = routeParams;

  const { defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const effectiveNamespace = namespace || defaultNamespace;

  const cdPipelineWatch = useCDPipelineWatchItem({
    name: cdPipelineName,
    namespace: effectiveNamespace,
    queryOptions: {
      enabled: !!cdPipelineName && !!effectiveNamespace,
    },
  });

  const stagesWatch = useStageWatchList({
    namespace: effectiveNamespace,
    labels: {
      [stageLabels.cdPipeline]: cdPipelineName ?? "",
    },
    queryOptions: {
      enabled: !!cdPipelineName && !!effectiveNamespace,
    },
  });

  return {
    cdPipeline: cdPipelineWatch.query.data,
    cdPipelineIsLoading: cdPipelineWatch.query.isLoading,
    cdPipelineError: cdPipelineWatch.query.error,
    otherStages: stagesWatch.data.array,
    otherStagesIsLoading: stagesWatch.query.isLoading,
    namespace: effectiveNamespace,
  };
};
