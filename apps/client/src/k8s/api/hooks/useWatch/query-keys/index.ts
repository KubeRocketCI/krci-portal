import { ResourceLabels } from "@my-project/shared";

const CLUSTER_SCOPE_KEY = "__cluster__";

export function getK8sAPIQueryCacheKey(): string[] {
  return ["k8s:api"];
}

export function getK8sItemPermissionsQueryCacheKey(
  clusterName: string,
  namespace: string,
  resourcePlural: string
): string[] {
  return ["k8s:itemPermissions", clusterName, namespace, resourcePlural];
}

export function getK8sWatchListQueryCacheKey(
  clusterName: string,
  namespace: string | undefined,
  resourcePlural: string,
  labels?: ResourceLabels
): (string | undefined)[] {
  const nsKey = namespace ?? CLUSTER_SCOPE_KEY;
  const hasLabels = labels && Object.keys(labels).length > 0;

  if (hasLabels) {
    return ["k8s:watchList", clusterName, nsKey, resourcePlural, Object.entries(labels).toString()];
  }

  return ["k8s:watchList", clusterName, nsKey, resourcePlural];
}

export function getK8sWatchItemQueryCacheKey(
  clusterName: string,
  namespace: string | undefined,
  resourcePlural: string,
  name: string | undefined
): (string | undefined)[] {
  return ["k8s:watchItem", clusterName, namespace ?? CLUSTER_SCOPE_KEY, resourcePlural, name];
}
