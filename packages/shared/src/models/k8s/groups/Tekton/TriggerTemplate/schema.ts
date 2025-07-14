import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../core";
import { pipelineTypeEnum } from "../Pipeline";
import { triggerTemplateLabels } from "./labels";

const triggerTemplateLabelsSchema = z.object({
  [triggerTemplateLabels.pipelineType]: pipelineTypeEnum.optional(),
});

export const triggerTemplateSchema = kubeObjectBaseSchema
  .extend({
    metadata: kubeObjectMetadataSchema.extend({
      labels: triggerTemplateLabelsSchema,
    }),
  })
  .catchall(z.any());

export const triggerTemplateDraftSchema = kubeObjectBaseDraftSchema
  .extend({
    metadata: kubeObjectDraftMetadataSchema.extend({
      labels: triggerTemplateLabelsSchema,
    }),
  })
  .catchall(z.any());
