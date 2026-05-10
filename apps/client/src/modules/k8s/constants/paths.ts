export const PATH_K8S_PODS_FULL = "/c/$clusterName/k8s/pods" as const;
export const PATH_K8S_NODES_FULL = "/c/$clusterName/k8s/nodes" as const;
export const PATH_K8S_DETAIL_NS_FULL = "/c/$clusterName/k8s/ns/$kind/$namespace/$name" as const;
export const PATH_K8S_DETAIL_CLUSTER_FULL = "/c/$clusterName/k8s/cluster/$kind/$name" as const;
