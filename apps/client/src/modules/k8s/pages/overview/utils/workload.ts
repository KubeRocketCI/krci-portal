import type { KubeObjectBase } from "@my-project/shared";
import { resourceRegistry } from "@/modules/k8s/registry";
import type { DonutSlice } from "../components/DonutChart";
import { severityColor } from "./status-color";

export type WorkloadKind = "deployments" | "statefulsets" | "daemonsets" | "jobs" | "cronjobs";

export const WORKLOAD_KINDS: { key: WorkloadKind; label: string }[] = [
  { key: "deployments", label: "Deployments" },
  { key: "statefulsets", label: "StatefulSets" },
  { key: "daemonsets", label: "DaemonSets" },
  { key: "jobs", label: "Jobs" },
  { key: "cronjobs", label: "CronJobs" },
];

export function bucketWorkload(items: KubeObjectBase[], kind: WorkloadKind): DonutSlice[] {
  const statusFn = resourceRegistry[kind]?.status;
  const buckets = new Map<string, { value: number; color: string }>();

  for (const item of items) {
    const status = statusFn?.(item) ?? { phase: "Unknown", severity: "neutral" };
    const bucket = buckets.get(status.phase) ?? { value: 0, color: severityColor(status.severity) };
    bucket.value += 1;
    buckets.set(status.phase, bucket);
  }

  return [...buckets.entries()].map(([name, { value, color }]) => ({ name, value, color }));
}

export function workloadHealth(items: KubeObjectBase[], kind: WorkloadKind): { total: number; healthy: number } {
  const statusFn = resourceRegistry[kind]?.status;
  let healthy = 0;
  for (const item of items) {
    if (statusFn?.(item)?.severity === "success") healthy += 1;
  }
  return { total: items.length, healthy };
}
