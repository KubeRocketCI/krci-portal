import {
  K8sApiError,
  k8sWorkerPoolConfig,
  WORKER_POOL_RESOLVED_CONDITION,
  type KubeObjectListBase,
  type WorkerPool,
  type WorkerPoolAccess,
  type WorkerPoolResource,
} from "@my-project/shared";
import type { K8sClient } from "../../../clients/k8s/index.js";

/** The fleet answers without WorkerPool fields after this; the list itself is not cancelled. */
const WORKER_POOL_READ_DEADLINE_MS = 5_000;

interface WorkerPoolEntry {
  namespace: string;
  name: string;
  resource: WorkerPoolResource;
}

export interface WorkerPoolRead {
  access: WorkerPoolAccess;
  /** From the namespaces that were read. */
  items: WorkerPoolEntry[];
}

type NamespaceRead = { ok: true; items: WorkerPoolEntry[] } | { ok: false; denied: boolean };

function toResource(pool: WorkerPool): WorkerPoolResource {
  const resolved = pool.status?.sandboxClasses?.[0]?.conditions?.find(
    ({ type }) => type === WORKER_POOL_RESOLVED_CONDITION
  );
  return {
    desiredReplicas: pool.spec?.replicas ?? 0,
    readyReplicas: pool.status?.readyReplicas ?? 0,
    sandboxClass: pool.spec?.sandboxClasses?.[0]?.name || null,
    resolution: resolved?.reason || null,
  };
}

async function readNamespace(k8sClient: K8sClient, namespace: string): Promise<NamespaceRead> {
  try {
    const list = (await k8sClient.listAllResources(k8sWorkerPoolConfig, namespace)) as KubeObjectListBase<WorkerPool>;
    const pools: WorkerPool[] = list.items ?? [];
    return {
      ok: true,
      items: pools.map((pool) => ({
        namespace: pool.metadata.namespace || namespace,
        name: pool.metadata.name,
        resource: toResource(pool),
      })),
    };
  } catch (error) {
    if (error instanceof K8sApiError && error.statusCode === 404) return { ok: true, items: [] };
    const denied = error instanceof K8sApiError && error.statusCode === 403;
    if (!denied) console.warn(`[AgentSubstrate] WorkerPool list in namespace ${namespace} failed:`, error);
    return { ok: false, denied };
  }
}

/**
 * Each namespace fails alone; 404 (no WorkerPool type) gives no WorkerPool. Access: `error` when any list fails other
 * than with 403, or there is no KubeConfig; else `denied` when any list answers 403. No namespace: no call, `ok`.
 */
export async function readWorkerPools(
  k8sClient: K8sClient | null,
  namespaces: readonly string[]
): Promise<WorkerPoolRead> {
  if (namespaces.length === 0) return { access: "ok", items: [] };
  if (!k8sClient?.KubeConfig) return { access: "error", items: [] };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), WORKER_POOL_READ_DEADLINE_MS);
  });
  const reads = await Promise.race([
    Promise.all(namespaces.map((namespace) => readNamespace(k8sClient, namespace))),
    deadline,
  ]).finally(() => clearTimeout(timer));
  if (!reads) {
    console.warn(`[AgentSubstrate] WorkerPool list timed out after ${WORKER_POOL_READ_DEADLINE_MS} ms`);
    return { access: "error", items: [] };
  }
  const failed = reads.filter((read): read is Extract<NamespaceRead, { ok: false }> => !read.ok);
  return {
    access: failed.length === 0 ? "ok" : failed.every((read) => read.denied) ? "denied" : "error",
    items: reads.flatMap((read) => (read.ok ? read.items : [])),
  };
}
