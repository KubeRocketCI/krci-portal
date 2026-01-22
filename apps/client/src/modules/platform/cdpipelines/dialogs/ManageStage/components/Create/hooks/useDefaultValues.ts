import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { inClusterName, pipelineType, stageTriggerType, triggerTemplateLabels } from "@my-project/shared";
import React from "react";
import { STAGE_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { defaultQualityGate } from "../../fields/QualityGates/constants";
import { ManageStageFormValues } from "../../../types";

export const useDefaultValues = (): Partial<ManageStageFormValues> => {
  const {
    props: { cdPipeline, otherStages },
  } = useCurrentDialog();

  const stagesQuantity = otherStages.length;
  const namespace = cdPipeline?.metadata.namespace;
  const CDPipelineName = cdPipeline?.metadata.name;

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
      [STAGE_FORM_NAMES.order.name]: stagesQuantity,
      [STAGE_FORM_NAMES.triggerType.name]: stageTriggerType.Manual,
      [STAGE_FORM_NAMES.sourceLibraryName.name]: "default",
      [STAGE_FORM_NAMES.sourceType.name]: "default",
      [STAGE_FORM_NAMES.cluster.name]: inClusterName,
      [STAGE_FORM_NAMES.qualityGates.name]: [defaultQualityGate],
      [STAGE_FORM_NAMES.deployNamespace.name]: `${namespace}-${CDPipelineName}`,
      [STAGE_FORM_NAMES.triggerTemplate.name]: deployTriggerTemplate?.metadata.name,
      [STAGE_FORM_NAMES.cleanTemplate.name]: cleanTriggerTemplate?.metadata.name,
      [STAGE_FORM_NAMES.cdPipeline.name]: CDPipelineName,
    }),
    [CDPipelineName, cleanTriggerTemplate, deployTriggerTemplate, namespace, stagesQuantity]
  );
};
