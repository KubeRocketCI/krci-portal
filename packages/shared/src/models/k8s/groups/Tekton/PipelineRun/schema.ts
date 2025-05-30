import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../core";
import { pipelineTypeEnum } from "../Pipeline/schema";
import { pipelineRunLabels } from "./constants";

const pipelineRunLabelsSchema = z.object({
  [pipelineRunLabels.pipelineType]: pipelineTypeEnum,
  [pipelineRunLabels.codebaseBranch]: z.string(),
  [pipelineRunLabels.codebase]: z.string(),
  [pipelineRunLabels.pipeline]: z.string().optional(),
  [pipelineRunLabels.cdPipeline]: z.string().optional(),
  [pipelineRunLabels.stage]: z.string().optional(),
});

export const pipelineRunSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    labels: pipelineRunLabelsSchema,
  }),
});

export const pipelineRunDraftSchema = kubeObjectBaseDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema.extend({
    labels: pipelineRunLabelsSchema,
  }),
});
