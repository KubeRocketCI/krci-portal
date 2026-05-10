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

export const jobSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Job"),
  apiVersion: z.literal("batch/v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      parallelism: z.number().optional(),
      completions: z.number().optional(),
      template: podTemplateSpecSchema,
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      startTime: z.string().optional(),
      completionTime: z.string().optional(),
      active: z.number().optional(),
      succeeded: z.number().optional(),
      failed: z.number().optional(),
    })
    .passthrough()
    .optional(),
});

export const jobDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Job"),
  apiVersion: z.literal("batch/v1"),
  spec: z.object({}).passthrough().optional(),
});
