import type { Node as K8sNode, Pod } from "@my-project/shared";
import { parseCpuToCores, parseMemoryToBytes } from "@/core/utils/quantity";

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
