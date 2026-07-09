import type { PortalRole, RoleGroupsConfig } from "./types.js";

const DEFAULT_ADMIN_GROUPS = ["administrator"];

// The `typeof process` guard is load-bearing: this module is also bundled into the
// browser, where `process` is undefined. The client falling back to the default is
// safe — browser role checks are UX-only; the server is the authoritative gate.
function readGroupsFromEnv(envVar: string, fallback: string[]): string[] {
  const raw = typeof process !== "undefined" ? process.env?.[envVar] : undefined;

  if (!raw) {
    return fallback;
  }

  const groups = raw
    .split(",")
    .map((group) => group.trim())
    .filter(Boolean);

  return groups.length > 0 ? groups : fallback;
}

// `PORTAL_ADMIN_GROUPS` (comma-separated) overrides the admin binding so a deployment
// can rename its admin group without a code change; default is `administrator`.
export const ROLE_GROUPS: RoleGroupsConfig = {
  administrator: readGroupsFromEnv("PORTAL_ADMIN_GROUPS", DEFAULT_ADMIN_GROUPS),
};

export function getRoleGroups(role: PortalRole): string[] {
  return ROLE_GROUPS[role] ?? [];
}
