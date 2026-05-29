import { K8sApiError } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { rethrowOrHandleK8sError } from "../k8s/utils/handleK8sError/index.js";

/**
 * Build the standard `cause` shape used by handleK8sError so downstream
 * consumers treat not-found errors the same as any other K8s error. `reason`
 * is a stable machine-readable tag the REST adapter surfaces in the response
 * body so clients can branch on it without parsing the verbatim message
 * (which is replaced with a static status phrase at the REST boundary).
 */
export function k8sNotFoundCause(error: K8sApiError, reason: string) {
  return {
    source: "k8s" as const,
    reason,
    statusCode: error.statusCode,
    statusText: error.statusText,
    responseBody: error.responseBody,
  };
}

/**
 * Wrap a K8s `getResource` call so a 404 surfaces as a tRPC `NOT_FOUND` with
 * a stable `reason` tag. Any other error flows through rethrowOrHandleK8sError.
 */
export async function getResourceOrThrowNotFound<T>(
  fetch: () => Promise<T>,
  message: string,
  reason: string
): Promise<T> {
  try {
    return await fetch();
  } catch (error) {
    if (error instanceof K8sApiError && error.statusCode === 404) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message,
        cause: k8sNotFoundCause(error, reason),
      });
    }

    throw rethrowOrHandleK8sError(error);
  }
}
