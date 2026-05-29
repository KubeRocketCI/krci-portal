import type { K8sResourceConfig } from "@my-project/shared";
import { usePermissions } from "@/k8s/api/hooks/usePermissions";

/**
 * Permission check for any K8s workload action (scale, restart, rollback) that
 * mutates an existing resource via HTTP PATCH. K8s RBAC controls PATCH solely
 * via the "patch" verb; "update" gates HTTP PUT (replaceResource) which none of
 * these actions invoke. Requiring "update" here would over-restrict operators
 * granted patch-only on a workload (a common least-privilege pattern).
 */
export function useUpdatePermission(config: K8sResourceConfig) {
  const perms = usePermissions({
    group: config.group,
    version: config.version,
    resourcePlural: config.pluralName,
  });
  return {
    allowed: perms.data.patch.allowed,
    reason: perms.data.patch.reason,
  };
}
