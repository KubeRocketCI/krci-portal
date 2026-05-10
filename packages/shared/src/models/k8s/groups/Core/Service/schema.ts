import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const serviceSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Service"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      type: z.string().optional(),
      clusterIP: z.string().optional(),
      ports: z
        .array(
          z
            .object({
              name: z.string().optional(),
              port: z.number(),
              targetPort: z.union([z.number(), z.string()]).optional(),
              protocol: z.string().optional(),
              nodePort: z.number().optional(),
            })
            .passthrough()
        )
        .optional(),
      selector: z.record(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});

export const serviceDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Service"),
  apiVersion: z.literal("v1"),
  spec: z.object({}).passthrough().optional(),
});
