import type { WorkerPoolRow, WorkerRow } from "@my-project/shared";

export const HASH_TARGET_CLASS = "bg-primary/10 ring-primary ring-2 ring-inset";

const WORKER_ANCHOR_PREFIX = "worker/";

/** Fragment and element id of a worker. A Kubernetes name holds no `/`. */
export function workerAnchor({
  workerNamespace,
  workerPool,
  name,
}: Pick<WorkerRow, "workerNamespace" | "workerPool" | "name">) {
  return `${WORKER_ANCHOR_PREFIX}${workerNamespace}/${workerPool}/${name}`;
}

export const isWorkerAnchor = (hash: string) => hash.startsWith(WORKER_ANCHOR_PREFIX);

export function workerPoolAnchor({ namespace, name }: Pick<WorkerPoolRow, "namespace" | "name">) {
  return `worker-pool/${namespace}/${name}`;
}
