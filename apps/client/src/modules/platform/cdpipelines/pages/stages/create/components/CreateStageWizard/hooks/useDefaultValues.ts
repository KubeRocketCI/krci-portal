import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { useCDPipelineWatchItem } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useClusterStore } from "@/k8s/store";
import {
  inClusterName,
  pipelineType,
  stageLabels,
  stageSourceType,
  stageTriggerType,
  stageQualityGateType,
  triggerTemplateLabels,
  type TriggerTemplate,
} from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { v4 as uuidv4 } from "uuid";
import { NAMES } from "../names";
import { useSafeStageCreateParams } from "./useSafeStageCreateParams";

const defaultQualityGate = {
  id: uuidv4(),
  qualityGateType: stageQualityGateType.manual,
  stepName: "approve",
  autotestName: null,
  branchName: null,
};

interface UseDefaultValuesParams {
  triggerTemplateList: TriggerTemplate[];
  stagesQuantity: number;
}

export const useDefaultValues = ({ triggerTemplateList, stagesQuantity }: UseDefaultValuesParams) => {
  const { namespace, cdPipeline: cdPipelineName } = useSafeStageCreateParams();

  const { defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const effectiveNamespace = namespace || defaultNamespace;

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
      [NAMES.sourceType]: stageSourceType.default,
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
  const { namespace, cdPipeline: cdPipelineName } = useSafeStageCreateParams();

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

  const triggerTemplateListWatch = useTriggerTemplateWatchList();

  return {
    cdPipeline: cdPipelineWatch.query.data,
    cdPipelineIsLoading: cdPipelineWatch.query.isLoading,
    cdPipelineError: cdPipelineWatch.query.error,
    otherStages: stagesWatch.data.array,
    otherStagesIsLoading: stagesWatch.isLoading,
    // Use the watch wrapper's `isLoading` (isPending || isPlaceholderData), not the raw
    // query.isLoading. The list query sets placeholderData, so query.isLoading is false on
    // first render while the real templates are still loading — gating on it lets the form
    // mount with an empty cleanTemplate default before the templates arrive.
    triggerTemplatesIsLoading: triggerTemplateListWatch.isLoading,
    triggerTemplateList: triggerTemplateListWatch.data.array,
    namespace: effectiveNamespace,
  };
};
