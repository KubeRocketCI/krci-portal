import { TRPCClientError } from "@trpc/client";
import type { RequestError } from "@/core/types/global";

/**
 * Build the error a K8s GET raises for a name that does not exist. Use it when the
 * absence is known without asking the server, so callers cannot tell the two apart.
 */
export function createK8sNotFoundError(message: string): RequestError {
  return TRPCClientError.from({
    error: { code: -32004, message, data: { code: "NOT_FOUND", httpStatus: 404 } },
  });
}

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
