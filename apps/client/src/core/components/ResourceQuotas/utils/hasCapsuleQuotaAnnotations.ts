import { ResourceQuota } from "@my-project/shared";

const CAPSULE_QUOTA_ANNOTATION_PREFIX = "quota.capsule.clastix.io/";

export const hasCapsuleQuotaAnnotations = (item: ResourceQuota | undefined): boolean =>
  Object.keys(item?.metadata?.annotations ?? {}).some((key) => key.startsWith(CAPSULE_QUOTA_ANNOTATION_PREFIX));
