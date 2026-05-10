import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const cronJobSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("CronJob"),
  apiVersion: z.literal("batch/v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      schedule: z.string(),
      suspend: z.boolean().optional(),
      jobTemplate: z.object({}).passthrough(),
      concurrencyPolicy: z.string().optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      lastScheduleTime: z.string().optional(),
      lastSuccessfulTime: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const cronJobDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("CronJob"),
  apiVersion: z.literal("batch/v1"),
  spec: z.object({}).passthrough().optional(),
});
