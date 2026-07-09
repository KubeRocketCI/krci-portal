// Named `PortalRole`, not `Role`, to avoid colliding with the Kubernetes RBAC `Role`
// resource type already exported from `@my-project/shared`.
export type PortalRole = "administrator";

export type RoleGroupsConfig = Record<PortalRole, string[]>;

// How a session's identity was established. Portal roles are authoritative only for
// `oidc` (Keycloak) identities; `serviceaccount` sessions authenticate against the
// cluster but never carry portal roles (see `resolvePortalRoles`).
export type AuthSource = "oidc" | "serviceaccount";

// Every known portal role. Used server-side to derive a user's `roles` from their
// Kubernetes groups (see `resolveRoles`) and to build `portalRoleSchema`.
export const ALL_ROLES: PortalRole[] = ["administrator"];
