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

const resourceTemplateSchema = z
  .object({
    spec: z
      .object({
        pipelineRef: z
          .object({
            name: z.string().optional(),
          })
          .catchall(z.any())
          .optional(),
      })
      .catchall(z.any())
      .optional(),
  })
  .catchall(z.any());

const triggerTemplateSpecSchema = z
  .object({
    resourcetemplates: z.array(resourceTemplateSchema).optional(),
    params: z
      .array(
        z
          .object({ name: z.string(), description: z.string().optional(), default: z.string().optional() })
          .catchall(z.any())
      )
      .optional(),
  })
  .catchall(z.any());

export const triggerTemplateSchema = kubeObjectBaseSchema
  .extend({
    metadata: kubeObjectMetadataSchema.extend({
      // Optional because TriggerTemplates created outside the portal may not carry the pipelinetype label.
      labels: triggerTemplateLabelsSchema.optional(),
    }),
    spec: triggerTemplateSpecSchema.optional(),
  })
  .catchall(z.any());

export const triggerTemplateDraftSchema = kubeObjectBaseDraftSchema
  .extend({
    metadata: kubeObjectDraftMetadataSchema.extend({
      labels: triggerTemplateLabelsSchema,
    }),
  })
  .catchall(z.any());
