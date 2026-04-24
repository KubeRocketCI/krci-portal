import type { RequestError } from "@/core/types/global";

/**
 * Detect K8s 404 from a tRPC error.
 *
 * The K8sApiError `instanceof` check can fail across monorepo package boundaries,
 * causing handleK8sError to wrap the 404 as INTERNAL_SERVER_ERROR (httpStatus 500).
 * We check multiple signals to reliably detect a K8s "not found".
 */
export function isK8sNotFoundError(error: RequestError | null): boolean {
  if (!error) return false;
  if (error.data?.httpStatus === 404) return true;
  if (error.data?.code === "NOT_FOUND") return true;
  return error.message?.includes("404 Not Found") === true;
}

/**
 * Detect K8s 403 from a tRPC error.
 * Used to fall through to Tekton Results when the user lacks RBAC on the live resource.
 */
export function isK8sForbiddenError(error: RequestError | null): boolean {
  if (!error) return false;
  if (error.data?.httpStatus === 403) return true;
  if (error.data?.code === "FORBIDDEN") return true;
  return error.message?.includes("403 Forbidden") === true;
}
