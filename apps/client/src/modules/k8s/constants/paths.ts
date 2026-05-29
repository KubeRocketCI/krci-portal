export const PATH_K8S_OVERVIEW_FULL = "/c/$clusterName/k8s/overview" as const;
export const PATH_K8S_LIST_FULL = "/c/$clusterName/k8s/$kind" as const;
export const PATH_K8S_EVENTS_FULL = "/c/$clusterName/k8s/events" as const;
export const PATH_K8S_PODS_FULL = "/c/$clusterName/k8s/pods" as const;
export const PATH_K8S_NODES_FULL = "/c/$clusterName/k8s/nodes" as const;
export const PATH_K8S_DETAIL_NS_FULL = "/c/$clusterName/k8s/ns/$kind/$namespace/$name" as const;
export const PATH_K8S_DETAIL_CLUSTER_FULL = "/c/$clusterName/k8s/cluster/$kind/$name" as const;

// Custom Resource Definitions (cluster-scoped, custom detail page)
export const PATH_K8S_CRDS = "crds" as const;
export const PATH_K8S_CRDS_FULL = "/c/$clusterName/k8s/crds" as const;
export const PATH_K8S_CRDS_DETAIL = "crds/$name" as const;
export const PATH_K8S_CRDS_DETAIL_FULL = "/c/$clusterName/k8s/crds/$name" as const;

// Generic Custom Resource viewer (under a static cr/ parent)
export const PATH_K8S_CR = "cr" as const;
export const PATH_K8S_CR_LIST = "$group/$version/$plural" as const;
export const PATH_K8S_CR_LIST_FULL = "/c/$clusterName/k8s/cr/$group/$version/$plural" as const;
export const PATH_K8S_CR_DETAIL_NS = "ns/$group/$version/$plural/$namespace/$name" as const;
export const PATH_K8S_CR_DETAIL_NS_FULL = "/c/$clusterName/k8s/cr/ns/$group/$version/$plural/$namespace/$name" as const;
export const PATH_K8S_CR_DETAIL_CLUSTER = "cluster/$group/$version/$plural/$name" as const;
export const PATH_K8S_CR_DETAIL_CLUSTER_FULL = "/c/$clusterName/k8s/cr/cluster/$group/$version/$plural/$name" as const;
