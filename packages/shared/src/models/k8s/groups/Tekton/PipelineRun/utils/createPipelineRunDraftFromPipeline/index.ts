import { createRandomString, truncateName } from "../../../../../../../utils";
import { Pipeline } from "../../../Pipeline/types";
import { PipelineRunDraft } from "../../types";
import { TriggerTemplate } from "../../../TriggerTemplate";
import { pipelineLabels } from "../../../Pipeline/labels";
import { pipelineRunLabels } from "../../labels";

const getPipelineRunFromTriggerTemplate = (
  triggerTemplate: TriggerTemplate,
  pipeline: Pipeline
) => {
  if (!triggerTemplate) {
    return null;
  }

  const pipelineRun = triggerTemplate.spec.resourcetemplates?.[0];

  if (pipelineRun && pipelineRun.spec && pipelineRun.spec.pipelineRef) {
    pipelineRun.spec.pipelineRef.name = pipeline.metadata.name;
  }

  return pipelineRun;
};

export const createPipelineRunDraftFromPipeline = (
  triggerTemplate: TriggerTemplate | undefined,
  pipeline: Pipeline
): PipelineRunDraft => {
  if (triggerTemplate) {
    return getPipelineRunFromTriggerTemplate(triggerTemplate, pipeline);
  }

  const pipelineName = pipeline.metadata.name;
  const pipelineRunNamePrefix = "run-";
  const pipelineRunNamePostfix = `-${createRandomString()}`;

  const truncatedName = truncateName(
    pipelineName,
    pipelineRunNamePrefix.length + pipelineRunNamePostfix.length
  );

  const pipelineRunName = `${pipelineRunNamePrefix}${truncatedName}${pipelineRunNamePostfix}`;

  const pipelineRun: PipelineRunDraft = {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name: pipelineRunName,
      namespace: pipeline.metadata.namespace,
      labels: {
        [pipelineRunLabels.pipelineType]:
          pipeline.metadata.labels[pipelineLabels.pipelineType],
        [pipelineRunLabels.pipeline]: pipeline.metadata.name,
      },
    },
    spec: {
      pipelineRef: {
        name: pipeline.metadata.name,
      },
      params: (pipeline.spec.params || []).map((param) => {
        return {
          name: param.name,
          value: param.default || "",
        };
      }),
    },
  };

  return pipelineRun;
};
