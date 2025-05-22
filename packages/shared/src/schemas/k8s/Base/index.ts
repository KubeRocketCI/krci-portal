import { z } from "zod";

const stringDictSchema = z.record(z.string());

const kubeOwnerReferenceSchema = z.object({
  apiVersion: z.string(),
  blockOwnerDeletion: z.boolean(),
  controller: z.boolean(),
  kind: z.string(),
  name: z.string(),
  uid: z.string(),
});

export const kubeManagedFieldsEntrySchema = z.object({
  apiVersion: z.string(),
  fieldsType: z.string(),
  fieldsV1: z.string(),
  manager: z.string(),
  operation: z.string(),
  subresource: z.string(),
  timestamp: z.string(),
});
export type KubeManagedFieldsEntry = z.infer<
  typeof kubeManagedFieldsEntrySchema
>;

// Schema for metadata of resources to be created
export const kubeCreationMetadataSchema = z.object({
  annotations: stringDictSchema.optional(),
  deletionGracePeriodSeconds: z.number().optional(),
  finalizers: z.string().array().optional(),
  generateName: z.string().optional(),
  generation: z.number().optional(),
  labels: stringDictSchema.optional(),
  name: z.string(),
  namespace: z.string().optional(),
  ownerReferences: z.array(kubeOwnerReferenceSchema).optional(),
});
export type KubeCreationMetadata = z.infer<typeof kubeCreationMetadataSchema>;

// Schema for resources to be created
export const kubeObjectCreationSchema = z.object({
  apiVersion: z.string(),
  kind: z.string(),
  metadata: kubeCreationMetadataSchema,
});
export type KubeObjectCreation = z.infer<typeof kubeObjectCreationSchema>;

// Existing schemas retained for reference
export const kubeMetadataSchema = z.object({
  annotations: stringDictSchema.optional(),
  creationTimestamp: z.string(),
  deletionGracePeriodSeconds: z.number().optional(),
  deletionTimestamp: z.string().optional(),
  finalizers: z.string().array().optional(),
  generateName: z.string().optional(),
  generation: z.number().optional(),
  labels: stringDictSchema.optional(),
  managedFields: z.array(kubeManagedFieldsEntrySchema).optional(),
  name: z.string(),
  namespace: z.string().optional(),
  ownerReferences: z.array(kubeOwnerReferenceSchema).optional(),
  resourceVersion: z.string().optional(),
  selfLink: z.string().optional(),
  uid: z.string(),
});
export type KubeMetadata = z.infer<typeof kubeMetadataSchema>;

export const kubeObjectBaseSchema = z.object({
  apiVersion: z.string(),
  kind: z.string(),
  metadata: kubeMetadataSchema,
});
export type KubeObjectBase = z.infer<typeof kubeObjectBaseSchema>;

const KubeObjectListBaseSchema = z.object({
  apiVersion: z.string(),
  items: z.array(kubeObjectBaseSchema),
  kind: z.string(),
  metadata: kubeMetadataSchema,
});
export type KubeObjectListBase<T extends KubeObjectBase> = z.infer<
  typeof KubeObjectListBaseSchema
> & {
  items: T[];
};

export const defaultPermissionsToCheck = [
  "create",
  "update",
  "delete",
] as const;

export type PermissionsResult = Record<
  (typeof defaultPermissionsToCheck)[number],
  {
    allowed: boolean;
    reason: string;
  }
>;

export const defaultPermissions = {
  create: {
    allowed: false,
    reason: `You cannot create resources of this kind. Permission check result has not been received yet.`,
  },
  update: {
    allowed: false,
    reason: `You cannot update resources of this kind. Permission check result has not been received yet.`,
  },
  delete: {
    allowed: false,
    reason: `You cannot delete resources of this kind. Permission check result has not been received yet.`,
  },
};
