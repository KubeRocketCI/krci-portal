import { getRoleGroups } from "./config.js";
import { ALL_ROLES } from "./types.js";
import type { AuthSource, PortalRole } from "./types.js";

const ADMIN_ROLE: PortalRole = "administrator";

function isInGroups(callerGroups: string[], role: PortalRole): boolean {
  const groupsForRole = getRoleGroups(role);
  return callerGroups.some((group) => groupsForRole.includes(group));
}

// `administrator` is a superset of every role (an admin satisfies any check without
// being in that role's group). Fail-closed: undefined/empty groups → no roles → denied.
// Server-only: `getRoleGroups` reads `PORTAL_ADMIN_GROUPS` from `process.env`, which is
// undefined in the browser. Client code must never call this directly — it reads the
// server-computed `roles` on `auth.me` instead (see `resolveRoles` below).
export function hasRole(groups: string[] | undefined, role: PortalRole): boolean {
  const callerGroups = groups ?? [];

  if (isInGroups(callerGroups, ADMIN_ROLE)) {
    return true;
  }

  return isInGroups(callerGroups, role);
}

// Server-side derivation of a user's roles from their Kubernetes `groups`, computed once
// and attached to `auth.me`. The admin-superset rule is preserved because `hasRole`
// applies it internally for each role checked.
export function resolveRoles(groups: string[] | undefined): PortalRole[] {
  return ALL_ROLES.filter((role) => hasRole(groups, role));
}

// Authorization boundary between authN and authZ: portal roles come from Keycloak
// (OIDC) group claims ONLY. A `serviceaccount` session authenticates against the
// cluster (its K8s API access is governed by K8s RBAC), but carries no portal roles —
// so it is non-privileged in the portal by construction, regardless of its K8s group
// names. This is the single place role resolution is gated on identity source.
export function resolvePortalRoles(authSource: AuthSource, groups: string[] | undefined): PortalRole[] {
  return authSource === "oidc" ? resolveRoles(groups) : [];
}
