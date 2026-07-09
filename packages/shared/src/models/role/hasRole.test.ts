import { describe, expect, it, vi } from "vitest";
import { hasRole, resolvePortalRoles, resolveRoles } from "./hasRole.js";

describe("hasRole", () => {
  it("returns true when the caller is in the admin group and role is administrator", () => {
    expect(hasRole(["administrator"], "administrator")).toBe(true);
  });

  it("returns true when the caller is an administrator, satisfying any role check", () => {
    // Today "administrator" is the only role, but the admin-superset rule must hold
    // regardless of which role is being checked (verified against the role itself here;
    // the superset behavior is exercised again once a second role exists).
    expect(hasRole(["administrator", "some-other-group"], "administrator")).toBe(true);
  });

  it("returns false for a caller with unrelated groups (fail-closed)", () => {
    expect(hasRole(["group-1", "group-2"], "administrator")).toBe(false);
  });

  it("returns false for an empty groups array (fail-closed)", () => {
    expect(hasRole([], "administrator")).toBe(false);
  });

  it("returns false for undefined groups (fail-closed)", () => {
    expect(hasRole(undefined, "administrator")).toBe(false);
  });

  it("resolves a configured non-default group name via PORTAL_ADMIN_GROUPS", async () => {
    const previous = process.env.PORTAL_ADMIN_GROUPS;
    process.env.PORTAL_ADMIN_GROUPS = "platform-admins";

    try {
      // Re-import to pick up the env var read at module init.
      vi.resetModules();
      const { hasRole: hasRoleWithCustomConfig } = await import("./hasRole.js");

      expect(hasRoleWithCustomConfig(["platform-admins"], "administrator")).toBe(true);
      expect(hasRoleWithCustomConfig(["administrator"], "administrator")).toBe(false);
    } finally {
      if (previous === undefined) {
        delete process.env.PORTAL_ADMIN_GROUPS;
      } else {
        process.env.PORTAL_ADMIN_GROUPS = previous;
      }
      vi.resetModules();
    }
  });
});

describe("resolveRoles", () => {
  it("resolves administrator for a caller in the admin group", () => {
    expect(resolveRoles(["administrator"])).toEqual(["administrator"]);
  });

  it("resolves no roles for a caller with unrelated groups (fail-closed)", () => {
    expect(resolveRoles(["group-1"])).toEqual([]);
  });

  it("resolves no roles for undefined groups (fail-closed)", () => {
    expect(resolveRoles(undefined)).toEqual([]);
  });

  it("resolves administrator via a custom PORTAL_ADMIN_GROUPS binding", async () => {
    const previous = process.env.PORTAL_ADMIN_GROUPS;
    process.env.PORTAL_ADMIN_GROUPS = "administrator,system:serviceaccounts:krci";

    try {
      vi.resetModules();
      const { resolveRoles: resolveRolesWithCustomConfig } = await import("./hasRole.js");

      expect(resolveRolesWithCustomConfig(["system:serviceaccounts:krci"])).toEqual(["administrator"]);
      expect(resolveRolesWithCustomConfig(["group-1"])).toEqual([]);
    } finally {
      if (previous === undefined) {
        delete process.env.PORTAL_ADMIN_GROUPS;
      } else {
        process.env.PORTAL_ADMIN_GROUPS = previous;
      }
      vi.resetModules();
    }
  });
});

describe("resolvePortalRoles", () => {
  it("resolves roles from group claims for an oidc identity", () => {
    expect(resolvePortalRoles("oidc", ["administrator"])).toEqual(["administrator"]);
  });

  it("resolves no roles for an oidc identity with unrelated groups (fail-closed)", () => {
    expect(resolvePortalRoles("oidc", ["group-1"])).toEqual([]);
  });

  it("resolves no roles for a serviceaccount identity, regardless of its groups", () => {
    // The whole point of the decoupling: an SA is never privileged in the portal even
    // if its Kubernetes groups happen to match an admin binding.
    expect(resolvePortalRoles("serviceaccount", ["administrator"])).toEqual([]);
    expect(resolvePortalRoles("serviceaccount", ["system:masters"])).toEqual([]);
    expect(resolvePortalRoles("serviceaccount", undefined)).toEqual([]);
  });

  it("resolves no roles for a serviceaccount even when PORTAL_ADMIN_GROUPS would match its groups", async () => {
    const previous = process.env.PORTAL_ADMIN_GROUPS;
    process.env.PORTAL_ADMIN_GROUPS = "system:serviceaccounts:krci";

    try {
      vi.resetModules();
      const { resolvePortalRoles: resolvePortalRolesWithCustomConfig } = await import("./hasRole.js");

      // Even if an operator binds admin to a K8s group name, the source gate wins.
      expect(resolvePortalRolesWithCustomConfig("serviceaccount", ["system:serviceaccounts:krci"])).toEqual([]);
      expect(resolvePortalRolesWithCustomConfig("oidc", ["system:serviceaccounts:krci"])).toEqual(["administrator"]);
    } finally {
      if (previous === undefined) {
        delete process.env.PORTAL_ADMIN_GROUPS;
      } else {
        process.env.PORTAL_ADMIN_GROUPS = previous;
      }
      vi.resetModules();
    }
  });
});
