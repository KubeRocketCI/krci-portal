import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common";

// ServiceAccount-specific schemas
const objectReferenceSchema = z.object({
  apiVersion: z.string().optional(),
  fieldPath: z.string().optional(),
  kind: z.string().optional(),
  name: z.string().optional(),
  namespace: z.string().optional(),
  resourceVersion: z.string().optional(),
  uid: z.string().optional(),
});

const localObjectReferenceSchema = z.object({
  name: z.string().optional(),
});

export const serviceAccountSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("ServiceAccount"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  automountServiceAccountToken: z.boolean().optional(),
  imagePullSecrets: z.array(localObjectReferenceSchema).optional(),
  secrets: z.array(objectReferenceSchema).optional(),
});

export const serviceAccountDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("ServiceAccount"),
  apiVersion: z.literal("v1"),
  automountServiceAccountToken: z.boolean().optional(),
  imagePullSecrets: z.array(localObjectReferenceSchema).optional(),
  secrets: z.array(objectReferenceSchema).optional(),
});
