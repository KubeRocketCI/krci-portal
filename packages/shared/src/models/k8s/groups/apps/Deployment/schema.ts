import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

const containerSchema = z
  .object({
    name: z.string(),
    image: z.string().optional(),
  })
  .passthrough();

const podTemplateSpecSchema = z
  .object({
    metadata: kubeObjectMetadataSchema.optional(),
    spec: z
      .object({
        containers: z.array(containerSchema),
      })
      .passthrough(),
  })
  .passthrough();

export const deploymentSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Deployment"),
  apiVersion: z.literal("apps/v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      replicas: z.number().optional(),
      selector: z.object({}).passthrough(),
      template: podTemplateSpecSchema,
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      replicas: z.number().optional(),
      readyReplicas: z.number().optional(),
      updatedReplicas: z.number().optional(),
      availableReplicas: z.number().optional(),
      conditions: z.array(z.object({}).passthrough()).optional(),
    })
    .passthrough()
    .optional(),
});

export const deploymentDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Deployment"),
  apiVersion: z.literal("apps/v1"),
  spec: z.object({}).passthrough().optional(),
});
