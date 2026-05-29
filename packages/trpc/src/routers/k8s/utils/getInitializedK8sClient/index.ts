import { KubeConfig } from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED, errorK8sClientNotInitialized } from "../../errors/index.js";
import type { TRPCContext } from "../../../../context/types.js";

// Narrowed view of K8sClient with a guaranteed non-null KubeConfig — the factory
// throws if it's null, so consumers can drop the `!` assertion on every access.
export type InitializedK8sClient = K8sClient & { KubeConfig: KubeConfig };

/**
 * Builds a K8sClient from the request's session and asserts that the underlying
 * KubeConfig was loaded. Throws a TRPCError matching the standard
 * ERROR_K8S_CLIENT_NOT_INITIALIZED shape when the user has no session/token.
 *
 * Use at the start of any tRPC procedure that needs a K8sClient. Replaces the
 * repeating pattern:
 *   const k8sClient = new K8sClient(ctx.session);
 *   if (!k8sClient.KubeConfig) throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
 */
export function getInitializedK8sClient(ctx: Pick<TRPCContext, "session">): InitializedK8sClient {
  const k8sClient = new K8sClient(ctx.session);
  if (!k8sClient.KubeConfig) {
    throw new TRPCError(
      k8sClient.kubeConfigInitError
        ? errorK8sClientNotInitialized(k8sClient.kubeConfigInitError)
        : ERROR_K8S_CLIENT_NOT_INITIALIZED
    );
  }
  return k8sClient as InitializedK8sClient;
}
