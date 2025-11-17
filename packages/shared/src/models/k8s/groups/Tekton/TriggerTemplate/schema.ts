import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../common/index.js";
import { pipelineTypeEnum } from "../Pipeline/index.js";
import { triggerTemplateLabels } from "./labels.js";

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
