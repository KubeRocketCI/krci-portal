import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { requireRole } from "./requireRole";

const mockRedirect = vi.fn((opts: unknown) => {
  const error = new Error("redirect");
  (error as unknown as { isRedirect: boolean; opts: unknown }).isRedirect = true;
  (error as unknown as { isRedirect: boolean; opts: unknown }).opts = opts;
  return error;
});

vi.mock("@tanstack/react-router", () => ({
  redirect: (opts: unknown) => {
    throw mockRedirect(opts);
  },
}));

function makeContext(authMe: unknown) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["auth.me"], authMe);
  return { queryClient };
}

describe("requireRole", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it("allows a user whose server-computed roles include administrator through without redirecting", () => {
    const context = makeContext({ roles: ["administrator"] });

    expect(() => requireRole("administrator")({ context })).not.toThrow();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects a user without the administrator role to the Forbidden route (never /auth/login)", () => {
    const context = makeContext({ roles: [] });

    expect(() => requireRole("administrator")({ context })).toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({ to: "/forbidden" });
  });

  it("redirects (fail-closed) when there is no cached auth.me data", () => {
    const context = makeContext(undefined);

    expect(() => requireRole("administrator")({ context })).toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({ to: "/forbidden" });
  });

  it("redirects (fail-closed) when roles is undefined on the cached auth.me data", () => {
    const context = makeContext({});

    expect(() => requireRole("administrator")({ context })).toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({ to: "/forbidden" });
  });

  it("allows a user granted administrator via a custom PORTAL_ADMIN_GROUPS binding server-side", () => {
    // The client never sees the group binding — only the resolved role from auth.me.
    const context = makeContext({ roles: ["administrator"] });

    expect(() => requireRole("administrator")({ context })).not.toThrow();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
