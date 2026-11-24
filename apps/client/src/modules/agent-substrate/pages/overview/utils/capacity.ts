import type { WorkerPoolAccess, WorkerPoolResource } from "@my-project/shared";

/** Resource null: the WorkerPool list was not read (`denied`, `error`) or has no WorkerPool of this name. */
export function replicasText(resource: WorkerPoolResource | null, access: WorkerPoolAccess): string {
  if (resource) return `${resource.desiredReplicas} desired, ${resource.readyReplicas} ready`;
  switch (access) {
    case "denied":
      return "no access";
    case "error":
      return "not readable";
    case "ok":
      return "no WorkerPool resource";
  }
}
