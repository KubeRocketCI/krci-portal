import { TRPCError } from "@trpc/server";

type TRPCErrorOptions = ConstructorParameters<typeof TRPCError>[0];

// `cause` must be an Error subclass for tRPC v11's defaultFormatter to attach
// it to the wire payload (`data.source` is read off cause). Plain objects are
// stripped during serialization, so the client-side guard that suppresses the
// OIDC re-auth redirect would silently miss the `source: "k8s"` discriminator.
class K8sClientNotInitializedCause extends Error {
  readonly source = "k8s" as const;
  constructor(reason: string) {
    super(reason);
    this.name = "K8sClientNotInitializedCause";
  }
}

// A missing/uninitialized KubeConfig is a server-side configuration failure
// (e.g. no in-cluster context, missing CA data), not a session expiry or an
// RBAC denial. Using INTERNAL_SERVER_ERROR (HTTP 500) preserves that meaning
// so integration views in KRCI mode do not misclassify the failure as a
// `getForbiddenError`-style permission denial. The `source: "k8s"` marker on
// the cause keeps the client's auth-error handler from triggering an OIDC
// re-auth redirect, which is the same protection FORBIDDEN previously
// provided but without the HTTP-403 side effect.
export function errorK8sClientNotInitialized(reason: string): TRPCErrorOptions {
  return {
    code: "INTERNAL_SERVER_ERROR",
    message: reason,
    cause: new K8sClientNotInitializedCause(reason),
  } satisfies TRPCErrorOptions;
}

export const ERROR_K8S_CLIENT_NOT_INITIALIZED = errorK8sClientNotInitialized(
  "Kubernetes client could not be initialized for this session."
);
