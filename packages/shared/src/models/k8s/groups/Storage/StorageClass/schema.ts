import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const storageClassSchema = kubeObjectBaseSchema
  .extend({
    kind: z.literal("StorageClass"),
    apiVersion: z.literal("storage.k8s.io/v1"),
    metadata: kubeObjectMetadataSchema,
    provisioner: z.string(),
    reclaimPolicy: z.string().optional(),
    volumeBindingMode: z.string().optional(),
    parameters: z.record(z.string()).optional(),
  })
  .passthrough();

export const storageClassDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("StorageClass"),
  apiVersion: z.literal("storage.k8s.io/v1"),
});
