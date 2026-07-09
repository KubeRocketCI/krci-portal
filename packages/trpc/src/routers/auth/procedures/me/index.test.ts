import { createMockedContext } from "../../../../__mocks__/context.js";
import { mockSession } from "../../../../__mocks__/session.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ERROR_NO_SESSION_FOUND } from "../../errors/index.js";
import { TRPCError } from "@trpc/server";

// `createMockedContext` wires `session` directly to the shared `mockSession` singleton
// (no clone), so a test that mutates `mockContext.session.user` (e.g. the "no session"
// case below) leaks that mutation into every later test in this file. Snapshot the
// original user once and restore it before each test so tests stay order-independent.
const originalMockSessionUser = structuredClone(mockSession.user);

describe("authMeProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    mockSession.user = structuredClone(originalMockSessionUser);

    mockContext = createMockedContext();
    vi.clearAllMocks();
    caller = createCaller(mockContext);
  });

  it("should successfully return user data with server-computed roles", async () => {
    const result = await caller.auth.me();

    expect(result).toEqual({
      ...mockSession.user.data,
      issuerUrl: "https://mock-issuer.example.com",
      // mockSession.user.data.groups is ["group-1", "group-2"] — not the admin group.
      roles: [],
    });
  });

  it("should throw error if session is not found", async () => {
    mockContext.session.user = undefined;
    await expect(caller.auth.me()).rejects.toThrow(new TRPCError(ERROR_NO_SESSION_FOUND));
  });

  it("should resolve the administrator role for a user in the default admin group", async () => {
    mockContext.session.user!.data!.groups = ["administrator"];

    const result = await caller.auth.me();

    expect(result?.roles).toEqual(["administrator"]);
  });

  it("resolves no roles for a serviceaccount session, even with admin-matching groups", async () => {
    // Roles are a Keycloak (OIDC) concern; an SA identity is never privileged in the
    // portal regardless of its Kubernetes groups.
    mockContext.session.user!.authSource = "serviceaccount";
    mockContext.session.user!.data!.groups = ["administrator"];

    const result = await caller.auth.me();

    expect(result?.roles).toEqual([]);
  });

  describe("with a custom PORTAL_ADMIN_GROUPS binding", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv, PORTAL_ADMIN_GROUPS: "administrator,system:serviceaccounts:krci" };
    });

    afterEach(() => {
      process.env = originalEnv;
      vi.resetModules();
    });

    it("resolves the administrator role for a user in the custom admin group", async () => {
      const { createCaller: createCallerWithCustomConfig } = await import("../../../../routers/index.js");
      mockContext.session.user!.data!.groups = ["system:serviceaccounts:krci"];
      const callerWithCustomConfig = createCallerWithCustomConfig(mockContext);

      const result = await callerWithCustomConfig.auth.me();

      expect(result?.roles).toEqual(["administrator"]);
    });

    it("resolves no roles for a user not in any configured admin group", async () => {
      const { createCaller: createCallerWithCustomConfig } = await import("../../../../routers/index.js");
      mockContext.session.user!.data!.groups = ["group-1"];
      const callerWithCustomConfig = createCallerWithCustomConfig(mockContext);

      const result = await callerWithCustomConfig.auth.me();

      expect(result?.roles).toEqual([]);
    });
  });
});
