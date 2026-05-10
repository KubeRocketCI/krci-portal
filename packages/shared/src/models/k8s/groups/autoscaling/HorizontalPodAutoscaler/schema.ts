import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const horizontalPodAutoscalerSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("HorizontalPodAutoscaler"),
  apiVersion: z.literal("autoscaling/v2"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      scaleTargetRef: z.object({
        apiVersion: z.string().optional(),
        kind: z.string(),
        name: z.string(),
      }),
      minReplicas: z.number().optional(),
      maxReplicas: z.number(),
      metrics: z.array(z.object({}).passthrough()).optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      currentReplicas: z.number().optional(),
      desiredReplicas: z.number().optional(),
      currentMetrics: z.array(z.object({}).passthrough()).optional(),
    })
    .passthrough()
    .optional(),
});

export const horizontalPodAutoscalerDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("HorizontalPodAutoscaler"),
  apiVersion: z.literal("autoscaling/v2"),
  spec: z.object({}).passthrough().optional(),
});
