import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const namespaceSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Namespace"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z.object({}).passthrough().optional(),
  status: z
    .object({
      phase: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const namespaceDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Namespace"),
  apiVersion: z.literal("v1"),
  spec: z.object({}).passthrough().optional(),
});
