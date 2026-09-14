import { K8sApiError, type K8sResourceConfig } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { K8sClient } from "../../clients/k8s/index.js";
import { handleK8sError } from "../k8s/utils/handleK8sError/index.js";

/**
 * Build the standard `cause` shape used by `handleK8sError` so downstream
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
 * a stable `reason` tag. Any other error flows through `handleK8sError`.
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

    throw handleK8sError(error);
  }
}

/** `getResource` wrapper: 404 yields `undefined`; any other error goes through `handleK8sError`. */
export async function getResourceOrUndefined<T>(fetch: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fetch();
  } catch (error) {
    if (error instanceof K8sApiError && error.statusCode === 404) {
      return undefined;
    }

    throw handleK8sError(error);
  }
}

/**
 * Complete list of the resources matching `labelSelector`.
 *
 * No `limit` is sent: the apiserver returns the full set. A non-empty
 * `metadata.continue` marks a partial list; throws `list_truncated` in that
 * case. Never returns a partial list.
 */
export async function listCompleteOrThrow<T>(
  k8sClient: K8sClient,
  resourceConfig: K8sResourceConfig,
  namespace: string,
  labelSelector: string
): Promise<T[]> {
  let list;

  try {
    list = await k8sClient.listResource(resourceConfig, namespace, labelSelector);
  } catch (error) {
    throw handleK8sError(error);
  }

  const continueToken = (list.metadata as { continue?: string } | undefined)?.continue;

  if (continueToken) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `${resourceConfig.kind} list in namespace '${namespace}' was truncated`,
      cause: { source: "validation" as const, reason: "list_truncated" },
    });
  }

  return (list.items ?? []) as unknown as T[];
}
