import { K8sResourceConfig } from "../../../common/index.js";

export const k8sWorkerPoolConfig = {
  group: "ate.dev",
  version: "v1",
  apiVersion: "ate.dev/v1",
  kind: "WorkerPool",
  singularName: "workerpool",
  pluralName: "workerpools",
  mayBeAbsent: true,
} as const satisfies K8sResourceConfig;

/** The `status.sandboxClasses[].conditions[].type` that reports the sandbox class resolution. */
export const WORKER_POOL_RESOLVED_CONDITION = "Resolved";
