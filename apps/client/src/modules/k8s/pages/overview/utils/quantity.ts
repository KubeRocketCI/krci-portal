import type { Node as K8sNode, Pod } from "@my-project/shared";

const MEMORY_BINARY: Record<string, number> = {
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  Pi: 1024 ** 5,
  Ei: 1024 ** 6,
};

const MEMORY_DECIMAL: Record<string, number> = {
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
};

/**
 * Parse a Kubernetes CPU quantity into fractional cores.
 * Handles plain cores ("2"), millicores ("100m"), and metrics-style
 * micro/nano cores ("500u" / "250000000n").
 */
export function parseCpuToCores(value?: string | number): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const v = value.trim();
  if (v === "") return 0;
  if (v.endsWith("m")) return toNumber(v.slice(0, -1)) / 1000;
  if (v.endsWith("u")) return toNumber(v.slice(0, -1)) / 1e6;
  if (v.endsWith("n")) return toNumber(v.slice(0, -1)) / 1e9;
  return toNumber(v);
}

/**
 * Parse a Kubernetes memory quantity into bytes.
 * Handles binary suffixes (Ki/Mi/Gi/…), decimal suffixes (k/M/G/…), and plain bytes.
 */
export function parseMemoryToBytes(value?: string | number): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const v = value.trim();
  if (v === "") return 0;

  const binary = /^([0-9.]+)(Ki|Mi|Gi|Ti|Pi|Ei)$/.exec(v);
  if (binary) return toNumber(binary[1]) * MEMORY_BINARY[binary[2]];

  const decimal = /^([0-9.]+)([kKMGTPE])$/.exec(v);
  if (decimal) {
    const key = decimal[2] === "K" ? "k" : decimal[2];
    return toNumber(decimal[1]) * (MEMORY_DECIMAL[key] ?? 1);
  }

  return toNumber(v);
}

function toNumber(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export interface ResourceUsage {
  capacity: number;
  requests: number;
  limits: number;
}

export interface ClusterResources {
  cpu: ResourceUsage;
  memory: ResourceUsage;
}

const TERMINAL_PHASES = new Set(["Succeeded", "Failed"]);

/**
 * Aggregate allocatable capacity from nodes and requested/limited resources from
 * non-terminal pods. initContainer requests are intentionally omitted for
 * overview-grade accuracy.
 */
export function computeClusterResources(nodes: K8sNode[], pods: Pod[]): ClusterResources {
  let cpuCapacity = 0;
  let memoryCapacity = 0;
  for (const node of nodes) {
    cpuCapacity += parseCpuToCores(node.status?.allocatable?.cpu);
    memoryCapacity += parseMemoryToBytes(node.status?.allocatable?.memory);
  }

  let cpuRequests = 0;
  let cpuLimits = 0;
  let memoryRequests = 0;
  let memoryLimits = 0;
  for (const pod of pods) {
    if (TERMINAL_PHASES.has(pod.status?.phase ?? "")) continue;
    for (const container of pod.spec?.containers ?? []) {
      cpuRequests += parseCpuToCores(container.resources?.requests?.cpu);
      cpuLimits += parseCpuToCores(container.resources?.limits?.cpu);
      memoryRequests += parseMemoryToBytes(container.resources?.requests?.memory);
      memoryLimits += parseMemoryToBytes(container.resources?.limits?.memory);
    }
  }

  return {
    cpu: { capacity: cpuCapacity, requests: cpuRequests, limits: cpuLimits },
    memory: { capacity: memoryCapacity, requests: memoryRequests, limits: memoryLimits },
  };
}

export function formatCores(cores: number): string {
  if (!Number.isFinite(cores) || cores <= 0) return "0";
  if (cores >= 10) return cores.toFixed(0);
  if (cores >= 1) return cores.toFixed(1);
  return cores.toFixed(2);
}

export function formatMemory(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Mi";
  const gi = bytes / 1024 ** 3;
  if (gi >= 1) return `${gi.toFixed(1)} Gi`;
  const mi = bytes / 1024 ** 2;
  return `${mi.toFixed(0)} Mi`;
}
