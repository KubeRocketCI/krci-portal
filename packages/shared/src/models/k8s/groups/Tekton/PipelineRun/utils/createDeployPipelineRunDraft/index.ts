import { createRandomString, truncateName } from "../../../../../../../utils";
import { CDPipeline, Stage } from "../../../../KRCI";
import { PipelineRun } from "../../types";
import { pipelineRunLabels } from "../../labels";
import { pipelineType } from "../../../Pipeline/constants";

export const createDeployPipelineRunDraft = ({
  cdPipeline,
  stage,
  pipelineRunTemplate,
  appPayload,
}: {
  cdPipeline: CDPipeline;
  stage: Stage;
  pipelineRunTemplate: PipelineRun;
  appPayload: Record<
    string,
    {
      imageTag: string;
      customValues: boolean;
    }
  >;
}): PipelineRun => {
  const base = structuredClone(pipelineRunTemplate);

  const namePrefix = `deploy-`;
  const namePostfix = `-${createRandomString(4)}`;

  const truncatedName = truncateName(
    `${cdPipeline.metadata.name}-${stage.spec.name}`,
    namePrefix.length + namePostfix.length
  );

  const fullPipelineRunName = `${namePrefix}${truncatedName}${namePostfix}`;

  delete base.metadata.generateName;

  base.metadata.name = fullPipelineRunName;

  base.metadata.labels = base.metadata.labels || {};
  base.metadata.labels[pipelineRunLabels.cdPipeline] = cdPipeline.metadata.name;
  base.metadata.labels[pipelineRunLabels.stage] = stage.metadata.name;
  base.metadata.labels[pipelineRunLabels.cdStage] = stage.metadata.namespace;
  base.metadata.labels[pipelineRunLabels.pipelineType] = pipelineType.deploy;

  for (const param of base.spec.params || []) {
    switch (param.name) {
      case "CDSTAGE":
        param.value = stage.spec.name;
        break;
      case "CDPIPELINE":
        param.value = cdPipeline.metadata.name;
        break;
      case "APPLICATIONS_PAYLOAD":
        param.value = JSON.stringify(appPayload);
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
