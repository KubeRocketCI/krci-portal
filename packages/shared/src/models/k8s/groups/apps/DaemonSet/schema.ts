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

export const daemonSetSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("DaemonSet"),
  apiVersion: z.literal("apps/v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      selector: z.object({}).passthrough(),
      template: podTemplateSpecSchema,
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      currentNumberScheduled: z.number().optional(),
      desiredNumberScheduled: z.number().optional(),
      numberReady: z.number().optional(),
      numberAvailable: z.number().optional(),
    })
    .passthrough()
    .optional(),
});

export const daemonSetDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("DaemonSet"),
  apiVersion: z.literal("apps/v1"),
  spec: z.object({}).passthrough().optional(),
});
