import { ZodError } from "zod";
import { k8sStageConfig, stageLabels } from "../..";
import { StageDraft, CreateStageDraftInput } from "../../types";
import { stageDraftSchema, createStageDraftInputSchema } from "../../schema";

const { kind, apiVersion } = k8sStageConfig;

export const createStageDraftObject = (input: CreateStageDraftInput): StageDraft => {
  const parsedInput = createStageDraftInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: StageDraft = {
    apiVersion,
    kind,
    metadata: {
      name: `${input.cdPipeline}-${input.name}` || "your stage name",
      labels: {
        [stageLabels.cdPipeline]: input.cdPipeline,
      },
    },
    spec: {
      cdPipeline: input.cdPipeline,
      cleanTemplate: input.cleanTemplate,
      clusterName: input.clusterName,
      description: input.description,
      name: input.name,
      namespace: input.namespace,
      order: input.order,
      qualityGates: input.qualityGates,
      source: input.source,
      triggerTemplate: input.triggerTemplate,
      triggerType: input.triggerType,
    },
  };

  const parsedDraft = stageDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
