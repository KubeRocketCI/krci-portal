import { ResourceLabels } from "@my-project/shared";

export const getK8sAPIQueryCacheKey = () => ["k8s:api"];

export const getK8sItemPermissionsQueryCacheKey = (clusterName: string, namespace: string, resourcePlural: string) => [
  "k8s:itemPermissions",
  clusterName,
  namespace,
  resourcePlural,
];

export const getK8sWatchListQueryCacheKey = (
  clusterName: string,
  namespace: string,
  resourcePlural: string,
  labels?: ResourceLabels
) => ["k8s:watchList", clusterName, namespace, resourcePlural, labels?.toString() ?? ""];

export const getK8sWatchItemQueryCacheKey = (
  clusterName: string,
  namespace: string,
  resourcePlural: string,
  name: string | undefined
) => ["k8s:watchItem", clusterName, namespace, resourcePlural, name];
