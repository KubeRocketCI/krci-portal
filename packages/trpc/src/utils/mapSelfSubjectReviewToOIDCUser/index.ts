import type { OIDCUser } from "@my-project/shared";
import type { K8sSelfSubjectUserInfo } from "../../clients/k8s/index.js";

/**
 * Maps a Kubernetes SelfSubjectReview `status.userInfo` to the OIDCUser shape
 * the portal session requires (so Service Account identities flow through the
 * same session/UI code as OIDC users).
 *
 * Service Account usernames look like "system:serviceaccount:<namespace>:<name>".
 * - sub: uid || username — MUST be non-empty: tektonResults.getSummary keys its
 *   per-user cache on `sub`; an empty value would collapse every SA into the
 *   shared "anonymous" bucket.
 * - name: the SA short name (e.g. "edp-admin"), falling back to the full username.
 * - preferred_username: the full username (e.g. "system:serviceaccount:edp:edp-admin").
 * - email: "" — SAs have no email. OIDCUser.email is z.string() (not .email()),
 *   so an empty string is valid and renders harmlessly in the UI.
 * - groups: passed through as-is (display-only; authorization is enforced by the
 *   Kubernetes API via SelfSubjectAccessReview with the token).
 * - default_namespace: the namespace parsed from an SA username, else undefined.
 */
export function mapSelfSubjectReviewToOIDCUser(userInfo: K8sSelfSubjectUserInfo): OIDCUser {
  const username = userInfo.username ?? "";
  const uid = userInfo.uid ?? "";
  const groups = userInfo.groups ?? [];

  const saMatch = username.match(/^system:serviceaccount:([^:]+):([^:]+)$/);
  const defaultNamespace = saMatch?.[1];
  const displayName = saMatch?.[2] ?? username;

  return {
    sub: uid || username,
    name: displayName,
    preferred_username: username,
    email: "",
    groups,
    default_namespace: defaultNamespace,
  };
}
