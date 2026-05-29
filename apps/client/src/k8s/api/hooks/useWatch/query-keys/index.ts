import { ResourceLabels } from "@my-project/shared";

const CLUSTER_SCOPE_KEY = "__cluster__";

export function getK8sItemPermissionsQueryCacheKey(
  clusterName: string,
  namespace: string,
  group: string,
  resourcePlural: string
): string[] {
  // `group` is part of RBAC identity: a CRD whose plural collides with a built-in
  // (e.g. `pods.mycompany.io` vs core `pods`) must not share a permissions cache entry.
  return ["k8s:itemPermissions", clusterName, namespace, group, resourcePlural];
}

export function getK8sWatchListQueryCacheKey(
  clusterName: string,
  namespace: string | undefined,
  group: string,
  resourcePlural: string,
  labels?: ResourceLabels
): (string | undefined)[] {
  const nsKey = namespace ?? CLUSTER_SCOPE_KEY;
  const hasLabels = labels && Object.keys(labels).length > 0;

  // `group` is part of resource identity: a CRD whose plural collides with a
  // built-in (e.g. `pods.mycompany.io` vs core `pods`) or another CRD must not
  // share a watch cache entry.
  if (hasLabels) {
    return ["k8s:watchList", clusterName, nsKey, group, resourcePlural, Object.entries(labels).toString()];
  }

  return ["k8s:watchList", clusterName, nsKey, group, resourcePlural];
}

export function getK8sWatchItemQueryCacheKey(
  clusterName: string,
  namespace: string | undefined,
  group: string,
  resourcePlural: string,
  name: string | undefined
): (string | undefined)[] {
  return ["k8s:watchItem", clusterName, namespace ?? CLUSTER_SCOPE_KEY, group, resourcePlural, name];
}

/**
 * Returns the prefix key that matches ALL watchItem queries for a given
 * cluster + namespace + group + resource plural, regardless of the item name.
 * Use with {@link QueryClient.invalidateQueries} (prefix matching) to
 * invalidate every open detail page for a resource type in one call.
 */
export function getK8sWatchItemQueryCacheKeyPrefix(
  clusterName: string,
  namespace: string | undefined,
  group: string,
  resourcePlural: string
): string[] {
  return ["k8s:watchItem", clusterName, namespace ?? CLUSTER_SCOPE_KEY, group, resourcePlural];
}

export function getK8sDeploymentRevisionsQueryCacheKey(clusterName: string, namespace: string, name: string): string[] {
  return ["k8s:deploymentRevisions", clusterName, namespace, name];
}
