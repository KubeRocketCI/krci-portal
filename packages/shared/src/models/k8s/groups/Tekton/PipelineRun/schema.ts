import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../core";
import { pipelineTypeEnum } from "../Pipeline/schema";
import { pipelineRunLabels } from "./labels";

const pipelineRunLabelsSchema = z
  .object({
    [pipelineRunLabels.pipelineType]: pipelineTypeEnum,
    [pipelineRunLabels.codebaseBranch]: z.string().optional(),
    [pipelineRunLabels.codebase]: z.string().optional(),
    [pipelineRunLabels.pipeline]: z.string().optional(),
    [pipelineRunLabels.cdPipeline]: z.string().optional(),
    [pipelineRunLabels.stage]: z.string().optional(),
  })
  .catchall(z.string());

export const pipelineRunReasonEnum = z.enum([
  "started",
  "running",
  "cancelled",
  "succeeded",
  "completed",
  "failed",
  "pipelineruntimeout",
  "createrunfailed",
]);

export const pipelineRunStatusEnum = z.enum(["true", "false", "unknown"]);

export const pipelineRunSchema = kubeObjectBaseSchema
  .extend({
    metadata: kubeObjectMetadataSchema.extend({
      labels: pipelineRunLabelsSchema,
    }),
  })
  .catchall(z.any());

export const pipelineRunDraftSchema = kubeObjectBaseDraftSchema
  .extend({
    metadata: kubeObjectDraftMetadataSchema.extend({
      labels: pipelineRunLabelsSchema,
    }),
  })
  .catchall(z.any());
