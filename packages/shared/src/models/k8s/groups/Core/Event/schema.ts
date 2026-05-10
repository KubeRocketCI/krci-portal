import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const eventSchema = kubeObjectBaseSchema
  .extend({
    kind: z.literal("Event"),
    apiVersion: z.literal("v1"),
    metadata: kubeObjectMetadataSchema,
    type: z.string().optional(),
    reason: z.string().optional(),
    message: z.string().optional(),
    count: z.number().optional(),
    firstTimestamp: z.string().optional(),
    lastTimestamp: z.string().optional(),
    involvedObject: z
      .object({
        kind: z.string().optional(),
        namespace: z.string().optional(),
        name: z.string().optional(),
        uid: z.string().optional(),
        apiVersion: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const eventDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Event"),
  apiVersion: z.literal("v1"),
});
