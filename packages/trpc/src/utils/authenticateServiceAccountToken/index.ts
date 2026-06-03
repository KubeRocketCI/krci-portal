import { TRPCError } from "@trpc/server";
import { K8sApiError, type OIDCUser } from "@my-project/shared";

import { K8sClient } from "../../clients/k8s/index.js";
import { buildTokenInfoFromToken, type TokenInfo } from "../buildTokenInfoFromToken/index.js";
import { mapSelfSubjectReviewToOIDCUser } from "../mapSelfSubjectReviewToOIDCUser/index.js";

// Legacy (Secret-based) Service Account tokens have no `exp` claim and do not
// expire. Bound tokens (`kubectl create token`) carry `exp` and use it. We pass
// a 24h default (the session cap) so legacy tokens yield a full-length session
// instead of the 5-minute default used for opaque OIDC access tokens.
const SA_DEFAULT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Authenticates a Kubernetes Service Account token by validating it against the
 * cluster via SelfSubjectReview (the same call as `kubectl auth whoami`) and
 * building the session `data` (identity) and `secret` (token info) objects.
 *
 * This path is OIDC-independent — it never constructs an OIDCClient — so it
 * works in deployments with no OIDC configured. Shared by the web
 * `loginWithServiceAccountToken` procedure and the stateless Bearer auth path,
 * keeping both aligned.
 */
export async function authenticateServiceAccountToken(token: string): Promise<{
  data: OIDCUser;
  secret: TokenInfo;
}> {
  const k8sClient = K8sClient.fromToken(token);

  if (!k8sClient.KubeConfig) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Could not initialize Kubernetes client: ${k8sClient.kubeConfigInitError ?? "unknown error"}`,
    });
  }

  let userInfo;
  try {
    const review = await k8sClient.getSelfSubjectReview();
    userInfo = review.status?.userInfo;
  } catch (err) {
    if (err instanceof K8sApiError) {
      if (err.statusCode === 401 || err.statusCode === 403) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "The service account token was rejected by the cluster. Verify the token is valid and not expired.",
        });
      }
      if (err.statusCode === 404) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "The cluster does not support SelfSubjectReview. This requires Kubernetes 1.28+ (GA) or 1.26+ (beta).",
        });
      }
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to validate the service account token against the cluster.",
    });
  }

  if (!userInfo?.username) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Cluster returned an empty identity for this token.",
    });
  }

  return {
    data: mapSelfSubjectReviewToOIDCUser(userInfo),
    secret: buildTokenInfoFromToken(token, SA_DEFAULT_EXPIRATION_MS),
  };
}
