import z from "zod";
import { defaultPermissionsToCheck, k8sOperation, rbacOperation } from "./constants";
import {
  k8sResourceConfigSchema,
  kubeManagedFieldsEntrySchema,
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  KubeObjectListBaseSchema,
  kubeObjectMetadataSchema,
} from "./schema";
import { ValueOf } from "../../../utils/types";

export type KubeManagedFieldsEntry = z.infer<typeof kubeManagedFieldsEntrySchema>;

export type KubeCreationMetadata = z.infer<typeof kubeObjectDraftMetadataSchema>;

export type KubeObjectDraft = z.infer<typeof kubeObjectBaseDraftSchema>;

export type KubeMetadata = z.infer<typeof kubeObjectMetadataSchema>;

export type KubeObjectBase = z.infer<typeof kubeObjectBaseSchema>;

export type KubeObjectListBase<T extends KubeObjectBase> = z.infer<typeof KubeObjectListBaseSchema> & {
  items: T[];
};

export type ResourceLabels = Record<string, string> | undefined;

export interface K8sResourceConfig<Labels extends ResourceLabels = ResourceLabels>
  extends z.infer<typeof k8sResourceConfigSchema> {
  labels?: Labels;
}

export type DefaultPermissionListCheckResult = Record<
  (typeof defaultPermissionsToCheck)[number],
  {
    allowed: boolean;
    reason: string;
  }
>;

export type K8sOperation = ValueOf<typeof k8sOperation>;
export type RBACOperation = ValueOf<typeof rbacOperation>;
