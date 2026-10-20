import {
  RESOURCE_QUOTA_LABEL_TENANT,
  RESOURCE_QUOTA_LABEL_TENANT_LEGACY,
  type ResourceQuota,
} from "@my-project/shared";

const TENANT_LABEL_KEYS = [RESOURCE_QUOTA_LABEL_TENANT, RESOURCE_QUOTA_LABEL_TENANT_LEGACY] as const;

/**
 * Returns the Capsule-managed ResourceQuotas of a tenant: those whose current or legacy
 * tenant label equals `tenant`.
 */
export function selectTenantResourceQuotas(items: ResourceQuota[], tenant: string): ResourceQuota[] {
  return items.filter((item) => {
    const labels = item.metadata.labels ?? {};

    return TENANT_LABEL_KEYS.some((key) => labels[key] === tenant);
  });
}
