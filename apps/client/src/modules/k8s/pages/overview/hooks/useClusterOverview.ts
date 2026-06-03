import { useQuery } from "@tanstack/react-query";
import {
  k8sCronJobConfig,
  k8sDaemonSetConfig,
  k8sDeploymentConfig,
  k8sEventConfig,
  k8sJobConfig,
  k8sNamespaceConfig,
  k8sNodeConfig,
  k8sPodConfig,
  k8sStatefulSetConfig,
  type KubeObjectBase,
  type Namespace,
  type Node as K8sNode,
  type Pod,
} from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import type { UseWatchListResult } from "@/k8s/api/hooks/useWatch/types";
import { useK8sResourceList } from "@/modules/k8s/hooks/useK8sResourceList";
import type { WatchStatus } from "@/modules/k8s/components/WatchConnectionIndicator";
import type { OverviewEvent } from "../types";
import type { WorkloadKind } from "../utils/workload";

export type WorkloadResults = Record<WorkloadKind, UseWatchListResult<KubeObjectBase>>;

export interface ClusterOverview {
  nodes: UseWatchListResult<K8sNode>;
  pods: UseWatchListResult<Pod>;
  namespaces: UseWatchListResult<Namespace>;
  events: UseWatchListResult<OverviewEvent>;
  workloads: WorkloadResults;
  clusterDetails: ReturnType<typeof useClusterDetailsQuery>;
  watchStatus: WatchStatus;
}

function useClusterDetailsQuery() {
  const trpc = useTRPCClient();
  return useQuery({
    queryKey: ["k8s.clusterDetails"],
    queryFn: () => trpc.k8s.clusterDetails.query(),
    staleTime: 60_000,
  });
}

export function useClusterOverview(): ClusterOverview {
  const nodes = useK8sResourceList<K8sNode>(k8sNodeConfig, "");
  const pods = useK8sResourceList<Pod>(k8sPodConfig, "");
  const namespaces = useK8sResourceList<Namespace>(k8sNamespaceConfig, "");
  const events = useK8sResourceList<OverviewEvent>(k8sEventConfig, "");

  const deployments = useK8sResourceList<KubeObjectBase>(k8sDeploymentConfig, "");
  const statefulsets = useK8sResourceList<KubeObjectBase>(k8sStatefulSetConfig, "");
  const daemonsets = useK8sResourceList<KubeObjectBase>(k8sDaemonSetConfig, "");
  const jobs = useK8sResourceList<KubeObjectBase>(k8sJobConfig, "");
  const cronjobs = useK8sResourceList<KubeObjectBase>(k8sCronJobConfig, "");

  const clusterDetails = useClusterDetailsQuery();

  const watches = [nodes, pods, namespaces, events, deployments, statefulsets, daemonsets, jobs, cronjobs];
  const hasError = watches.some((watch) => watch.error);
  const watchStatus: WatchStatus = hasError ? "error" : "connected";

  return {
    nodes,
    pods,
    namespaces,
    events,
    workloads: { deployments, statefulsets, daemonsets, jobs, cronjobs },
    clusterDetails,
    watchStatus,
  };
}
