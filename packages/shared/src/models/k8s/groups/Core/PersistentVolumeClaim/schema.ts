import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const persistentVolumeClaimSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("PersistentVolumeClaim"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      accessModes: z.array(z.string()).optional(),
      storageClassName: z.string().optional(),
      resources: z
        .object({
          requests: z
            .object({
              storage: z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      volumeName: z.string().optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      phase: z.string().optional(),
      capacity: z
        .object({
          storage: z.string().optional(),
        })
        .passthrough()
        .optional(),
      accessModes: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});

export const persistentVolumeClaimDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("PersistentVolumeClaim"),
  apiVersion: z.literal("v1"),
  spec: z.object({}).passthrough().optional(),
});
