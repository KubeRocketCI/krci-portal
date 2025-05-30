import { createRandomString, truncateName } from "../../../../../../../utils";
import { CDPipeline, Stage } from "../../../../KRCI";
import { PipelineRun } from "../../types";
import { pipelineRunLabels } from "../../labels";
import { pipelineType } from "../../../Pipeline/constants";

export const createCleanPipelineRunDraft = ({
  CDPipeline,
  stage,
  pipelineRunTemplate,
}: {
  CDPipeline: CDPipeline;
  stage: Stage;
  pipelineRunTemplate: PipelineRun;
}): PipelineRun => {
  const base = structuredClone(pipelineRunTemplate);

  const namePrefix = `clean-`;
  const namePostfix = `-${createRandomString(4)}`;

  const truncatedName = truncateName(
    `${CDPipeline.metadata.name}-${stage.spec.name}`,
    namePrefix.length + namePostfix.length
  );

  const fullPipelineRunName = `${namePrefix}${truncatedName}${namePostfix}`;

  delete base.metadata.generateName;

  base.metadata.name = fullPipelineRunName;

  base.metadata.labels = base.metadata.labels || {};
  base.metadata.labels[pipelineRunLabels.cdPipeline] = CDPipeline.metadata.name;
  base.metadata.labels[pipelineRunLabels.stage] = stage.metadata.name;
  base.metadata.labels[pipelineRunLabels.pipelineType] = pipelineType.clean;

  for (const param of base.spec.params) {
    switch (param.name) {
      case "CDSTAGE":
        param.value = stage.spec.name;
        break;
      case "CDPIPELINE":
        param.value = CDPipeline.metadata.name;
        break;
      case "KUBECONFIG_SECRET_NAME":
        param.value = stage.spec.clusterName;
        break;
      default:
        break;
    }
  }

  return base;
};
