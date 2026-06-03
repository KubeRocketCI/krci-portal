import { useMemo } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Box, CircleCheck, Layers, Server, SquareStack } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
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
        <StatCardBody
          icon={Server}
          label="Nodes"
          value={nodeStats.total}
          loading={nodes.isLoading}
          health={
            nodeStats.total > 0 ? (
              <HealthLine
                ok={nodeStats.ready === nodeStats.total}
                okText={`All ${nodeStats.total} ready`}
                badText={`${nodeStats.total - nodeStats.ready} not ready`}
              />
            ) : null
          }
        />
      </Link>

      <Link to={PATH_K8S_PODS_FULL} params={{ clusterName }} className="group block">
        <StatCardBody
          icon={Box}
          label="Pods"
          value={podStats.total}
          loading={pods.isLoading}
          health={
            podStats.total > 0 ? (
              <HealthLine
                ok={podStats.problems === 0}
                okText={`${podStats.running} running`}
                badText={`${podStats.problems} not healthy`}
              />
            ) : null
          }
        />
      </Link>

      <Link to={PATH_K8S_LIST_FULL} params={{ clusterName, kind: "deployments" }} className="group block">
        <StatCardBody
          icon={Layers}
          label="Workloads"
          value={workloadStats.total}
          loading={WORKLOAD_KINDS.some(({ key }) => workloads[key].isLoading)}
          health={
            workloadStats.total > 0 ? (
              <HealthLine
                ok={workloadStats.healthy === workloadStats.total}
                okText={`${workloadStats.healthy} healthy`}
                badText={`${workloadStats.total - workloadStats.healthy} degraded`}
              />
            ) : null
          }
        />
      </Link>

      <Link to={PATH_K8S_LIST_FULL} params={{ clusterName, kind: "namespaces" }} className="group block">
        <StatCardBody
          icon={SquareStack}
          label="Namespaces"
          value={namespaceStats.total}
          loading={namespaces.isLoading}
          health={
            namespaceStats.total > 0 ? (
              <HealthLine
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

interface StatCardBodyProps {
  icon: LucideIcon;
  label: string;
  value: number;
  loading: boolean;
  health: ReactNode;
}

function StatCardBody({ icon: Icon, label, value, loading, health }: StatCardBodyProps) {
  return (
    <Card className="hover:border-primary/40 h-full transition-colors">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="bg-muted rounded-md p-2">
          <Icon className="text-muted-foreground h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          )}
          {!loading && health}
        </div>
        <ArrowRight
          className="text-muted-foreground/0 group-hover:text-muted-foreground mt-1 h-4 w-4 shrink-0 transition-colors"
          aria-hidden
        />
      </CardContent>
    </Card>
  );
}

function HealthLine({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return ok ? (
    <span className="text-status-success mt-1 flex items-center gap-1 text-xs">
      <CircleCheck className="h-3.5 w-3.5" aria-hidden />
      {okText}
    </span>
  ) : (
    <span className="text-status-error mt-1 flex items-center gap-1 text-xs">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden />
      {badText}
    </span>
  );
}
