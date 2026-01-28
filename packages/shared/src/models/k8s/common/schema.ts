import z from "zod";

export const k8sOperationEnum = z.enum(["list", "read", "create", "delete", "patch", "connect", "replace"]);

export const rbacOperationEnum = z.enum([
  "get",
  "list",
  "watch",
  "create",
  "update",
  "patch",
  "delete",
  "deletecollection",
  "connect",
]);

export const stringDictSchema = z.record(z.string());
export const optionalStringDictSchema = z.record(z.string().optional());

export const k8sResourceConfigSchema = z.object({
  apiVersion: z.string(),
  kind: z.string(),
  group: z.string(),
  version: z.string(),
  singularName: z.string(),
  pluralName: z.string(),
  labels: stringDictSchema.optional(),
  /** Indicates whether this resource is cluster-scoped (no namespace) */
  clusterScoped: z.boolean().optional(),
});

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
  fieldsV1: z.record(z.any()),
  manager: z.string(),
  operation: z.string(),
  subresource: z.string().optional(),
  timestamp: z.string().optional(),
});

// Schema for metadata of resources to be created
export const kubeObjectDraftMetadataSchema = z.object({
  annotations: stringDictSchema.optional(),
  deletionGracePeriodSeconds: z.number().optional(),
  finalizers: z.string().array().optional(),
  generateName: z.string().optional(),
  generation: z.number().optional(),
  labels: optionalStringDictSchema.optional(),
  name: z.string(),
  namespace: z.string().optional(),
  ownerReferences: z.array(kubeOwnerReferenceSchema).optional(),
});

// Schema for resources to be created
export const kubeObjectBaseDraftSchema = z.object({
  apiVersion: z.string(),
  kind: z.string(),
  metadata: kubeObjectDraftMetadataSchema,
});

// Existing schemas retained for reference
export const kubeObjectMetadataSchema = z.object({
  annotations: stringDictSchema.optional(),
  creationTimestamp: z.string(),
  deletionGracePeriodSeconds: z.number().optional(),
  deletionTimestamp: z.string().optional(),
  finalizers: z.string().array().optional(),
  generateName: z.string().optional(),
  generation: z.number().optional(),
  labels: optionalStringDictSchema.optional(),
  managedFields: z.array(kubeManagedFieldsEntrySchema).optional(),
  name: z.string(),
  namespace: z.string().optional(),
  ownerReferences: z.array(kubeOwnerReferenceSchema).optional(),
  resourceVersion: z.string().optional(),
  selfLink: z.string().optional(),
  uid: z.string(),
});

export const kubeObjectBaseSchema = z.object({
  apiVersion: z.string(),
  kind: z.string(),
  metadata: kubeObjectMetadataSchema,
});

export const KubeObjectListBaseSchema = z.object({
  apiVersion: z.string(),
  items: z.array(kubeObjectBaseSchema),
  kind: z.string(),
  metadata: kubeObjectMetadataSchema,
});
