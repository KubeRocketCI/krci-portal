import type { WorkerPoolRow, WorkerRow } from "@my-project/shared";

/** The highlight of the row that the URL fragment names. */
export const HASH_TARGET_CLASS = "bg-primary/10 ring-primary ring-2 ring-inset";

/** URL fragment and element id of a worker on the Workers page. A Kubernetes name holds no `/`. */
export function workerAnchor({
  workerNamespace,
  workerPool,
  name,
}: Pick<WorkerRow, "workerNamespace" | "workerPool" | "name">) {
  return `worker/${workerNamespace}/${workerPool}/${name}`;
}

/** URL fragment and element id of a worker pool row on the Worker pools page. */
export function workerPoolAnchor({ namespace, name }: Pick<WorkerPoolRow, "namespace" | "name">) {
  return `worker-pool/${namespace}/${name}`;
}
