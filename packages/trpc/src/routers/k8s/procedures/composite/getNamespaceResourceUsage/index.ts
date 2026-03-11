import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { TRPCError } from "@trpc/server";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";

const TOP_PODS_LIMIT = 5;

interface PodMetricsContainer {
  name: string;
  usage: {
    cpu: string;
    memory: string;
  };
}

interface PodMetricsItem {
  metadata: { name: string; namespace: string };
  timestamp: string;
  window: string;
  containers: PodMetricsContainer[];
}

interface PodMetricsList {
  kind: string;
  apiVersion: string;
  items: PodMetricsItem[];
}

/**
 * Parse K8s CPU quantity to cores.
 * Mirrors the logic in ResourceQuotas/utils/convertToNumber for CPU values.
 */
function parseCpu(value: string): number {
  if (value.endsWith("n")) return parseFloat(value) / 1_000_000_000;
  if (value.endsWith("u")) return parseFloat(value) / 1_000_000;
  if (value.endsWith("m")) return parseFloat(value) / 1_000;
  return parseFloat(value) || 0;
}

/**
 * Parse K8s memory quantity to bytes.
 * Mirrors the logic in ResourceQuotas/utils/convertToNumber for memory values.
 */
function parseMemoryBytes(value: string): number {
  if (value.endsWith("Ki")) return parseFloat(value) * 1024;
  if (value.endsWith("Mi")) return parseFloat(value) * 1024 * 1024;
  if (value.endsWith("Gi")) return parseFloat(value) * 1024 * 1024 * 1024;
  if (value.endsWith("Ti")) return parseFloat(value) * 1024 * 1024 * 1024 * 1024;
  if (value.endsWith("k") || value.endsWith("K")) return parseFloat(value) * 1000;
  if (value.endsWith("M")) return parseFloat(value) * 1_000_000;
  if (value.endsWith("G")) return parseFloat(value) * 1_000_000_000;
  return parseFloat(value) || 0;
}

export const getNamespaceResourceUsageProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { namespace } = input;

    const k8sClient = new K8sClient(ctx.session);
    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    try {
      const podMetrics = await k8sClient.fetchApiPath<PodMetricsList>(
        `/apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods`
      );

      let totalCpuCores = 0;
      let totalMemoryBytes = 0;
      let podCount = 0;

      const pods: Array<{
        name: string;
        cpuCores: number;
        memoryMi: number;
      }> = [];

      for (const item of podMetrics.items ?? []) {
        let podCpu = 0;
        let podMem = 0;

        for (const container of item.containers ?? []) {
          podCpu += parseCpu(container.usage.cpu);
          podMem += parseMemoryBytes(container.usage.memory);
        }

        totalCpuCores += podCpu;
        totalMemoryBytes += podMem;
        podCount++;

        pods.push({
          name: item.metadata.name,
          cpuCores: podCpu,
          memoryMi: podMem / (1024 * 1024),
        });
      }

      pods.sort((a, b) => b.cpuCores - a.cpuCores);

      return {
        totalCpuCores,
        totalMemoryMi: totalMemoryBytes / (1024 * 1024),
        podCount,
        topPods: pods.slice(0, TOP_PODS_LIMIT),
      };
    } catch (error) {
      throw handleK8sError(error);
    }
  });
