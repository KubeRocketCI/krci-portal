import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const nodeSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Node"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      taints: z
        .array(
          z
            .object({
              key: z.string(),
              value: z.string().optional(),
              effect: z.string(),
            })
            .passthrough()
        )
        .optional(),
      unschedulable: z.boolean().optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      addresses: z
        .array(
          z
            .object({
              type: z.string(),
              address: z.string(),
            })
            .passthrough()
        )
        .optional(),
      nodeInfo: z.object({}).passthrough().optional(),
      conditions: z.array(z.object({}).passthrough()).optional(),
      capacity: z.record(z.string()).optional(),
      allocatable: z.record(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});

export const nodeDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Node"),
  apiVersion: z.literal("v1"),
  spec: z.object({}).passthrough().optional(),
});
