import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const persistentVolumeSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("PersistentVolume"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      capacity: z
        .object({
          storage: z.string().optional(),
        })
        .passthrough()
        .optional(),
      accessModes: z.array(z.string()).optional(),
      persistentVolumeReclaimPolicy: z.string().optional(),
      storageClassName: z.string().optional(),
      claimRef: z
        .object({
          namespace: z.string().optional(),
          name: z.string().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      phase: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const persistentVolumeDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("PersistentVolume"),
  apiVersion: z.literal("v1"),
  spec: z.object({}).passthrough().optional(),
});
