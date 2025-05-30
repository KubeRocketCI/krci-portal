import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../core";
import { pipelineLabels } from "./labels";
import { pipelineType } from "./constants";

export const pipelineTypeEnum = z.enum([
  "build",
  "review",
  "deploy",
  "clean",
  "security",
  "release",
  "tests",
]);

const pipelineLabelsSchema = z.object({
  [pipelineLabels.pipelineType]: pipelineTypeEnum,
  [pipelineLabels.triggerTemplate]: z.string(),
});

export const pipelineSchema = kubeObjectBaseSchema
  .extend({
    metadata: kubeObjectMetadataSchema.extend({
      labels: pipelineLabelsSchema,
    }),
  })
  .catchall(z.any());

export const pipelineDraftSchema = kubeObjectBaseDraftSchema
  .extend({
    metadata: kubeObjectDraftMetadataSchema.extend({
      labels: pipelineLabelsSchema,
    }),
  })
  .catchall(z.any());
