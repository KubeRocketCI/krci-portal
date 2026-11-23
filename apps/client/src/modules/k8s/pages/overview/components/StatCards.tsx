import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Box, Layers, Server, SquareStack } from "lucide-react";
import { StatCard, StatHealthLine } from "@/core/components/StatCard";
import { PATH_K8S_LIST_FULL, PATH_K8S_NODES_FULL, PATH_K8S_PODS_FULL } from "@/modules/k8s/constants/paths";
import type { KubeObjectBase, Namespace, Node as K8sNode, Pod } from "@my-project/shared";
import type { UseWatchListResult } from "@/k8s/api/hooks/useWatch/types";
import type { WorkloadResults } from "../hooks/useClusterOverview";
import { WORKLOAD_KINDS, workloadHealth, type WorkloadKind } from "../utils/workload";

interface StatCardsProps {
  clusterName: string;
  nodes: UseWatchListResult<K8sNode>;
  pods: UseWatchListResult<Pod>;
  namespaces: UseWatchListResult<Namespace>;
  workloads: WorkloadResults;
}

export function StatCards({ clusterName, nodes, pods, namespaces, workloads }: StatCardsProps) {
  const nodeStats = useMemo(() => {
    const items = nodes.data.array;
    let ready = 0;
    for (const node of items) {
      const conditions = (node.status?.conditions ?? []) as unknown as Array<{ type?: string; status?: string }>;
      if (conditions.find((c) => c.type === "Ready")?.status === "True") ready += 1;
    }
    return { total: items.length, ready };
  }, [nodes.data.array]);

  const podStats = useMemo(() => {
    let running = 0;
    let problems = 0;
    for (const pod of pods.data.array) {
      const phase = pod.status?.phase;
      if (phase === "Running") running += 1;
      else if (phase === "Failed" || phase === "Unknown") problems += 1;
    }
    return { total: pods.data.array.length, running, problems };
  }, [pods.data.array]);

  // Bind the (memoized, stable) arrays to locals so the memo recomputes only on
  // real data changes — not on every render, since `workloads` is a fresh object each time.
  const deploymentItems = workloads.deployments.data.array;
  const statefulSetItems = workloads.statefulsets.data.array;
  const daemonSetItems = workloads.daemonsets.data.array;
  const jobItems = workloads.jobs.data.array;
  const cronJobItems = workloads.cronjobs.data.array;

  const workloadStats = useMemo(() => {
    const groups: Array<[WorkloadKind, KubeObjectBase[]]> = [
      ["deployments", deploymentItems],
      ["statefulsets", statefulSetItems],
      ["daemonsets", daemonSetItems],
      ["jobs", jobItems],
      ["cronjobs", cronJobItems],
    ];
    let total = 0;
    let healthy = 0;
    for (const [key, items] of groups) {
      const stats = workloadHealth(items, key);
      total += stats.total;
      healthy += stats.healthy;
    }
    return { total, healthy };
  }, [deploymentItems, statefulSetItems, daemonSetItems, jobItems, cronJobItems]);

  const namespaceStats = useMemo(() => {
    let terminating = 0;
    for (const ns of namespaces.data.array) {
      if (ns.status?.phase === "Terminating") terminating += 1;
    }
    return { total: namespaces.data.array.length, terminating };
  }, [namespaces.data.array]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Link to={PATH_K8S_NODES_FULL} params={{ clusterName }} className="group block">
        <StatCard
          icon={Server}
          label="Nodes"
          value={nodeStats.total}
          loading={nodes.isLoading}
          detail={
            nodeStats.total > 0 ? (
              <StatHealthLine
                ok={nodeStats.ready === nodeStats.total}
                okText={`All ${nodeStats.total} ready`}
                badText={`${nodeStats.total - nodeStats.ready} not ready`}
              />
            ) : null
          }
        />
      </Link>

      <Link to={PATH_K8S_PODS_FULL} params={{ clusterName }} className="group block">
        <StatCard
          icon={Box}
          label="Pods"
          value={podStats.total}
          loading={pods.isLoading}
          detail={
            podStats.total > 0 ? (
              <StatHealthLine
                ok={podStats.problems === 0}
                okText={`${podStats.running} running`}
                badText={`${podStats.problems} not healthy`}
              />
            ) : null
          }
        />
      </Link>

      <Link to={PATH_K8S_LIST_FULL} params={{ clusterName, kind: "deployments" }} className="group block">
        <StatCard
          icon={Layers}
          label="Workloads"
          value={workloadStats.total}
          loading={WORKLOAD_KINDS.some(({ key }) => workloads[key].isLoading)}
          detail={
            workloadStats.total > 0 ? (
              <StatHealthLine
                ok={workloadStats.healthy === workloadStats.total}
                okText={`${workloadStats.healthy} healthy`}
                badText={`${workloadStats.total - workloadStats.healthy} degraded`}
              />
            ) : null
          }
        />
      </Link>

      <Link to={PATH_K8S_LIST_FULL} params={{ clusterName, kind: "namespaces" }} className="group block">
        <StatCard
          icon={SquareStack}
          label="Namespaces"
          value={namespaceStats.total}
          loading={namespaces.isLoading}
          detail={
            namespaceStats.total > 0 ? (
              <StatHealthLine
                ok={namespaceStats.terminating === 0}
                okText="All active"
                badText={`${namespaceStats.terminating} terminating`}
              />
            ) : null
          }
        />
      </Link>
    </div>
  );
}
