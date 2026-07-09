import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHasRole } from "./useHasRole";

const mockUseAuth = vi.fn();

vi.mock("@/core/auth/provider", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("useHasRole", () => {
  it("returns true for a user whose server-computed roles include administrator", () => {
    mockUseAuth.mockReturnValue({ user: { roles: ["administrator"] } });

    const { result } = renderHook(() => useHasRole("administrator"));

    expect(result.current).toBe(true);
  });

  it("returns false for a user without the administrator role", () => {
    mockUseAuth.mockReturnValue({ user: { roles: [] } });

    const { result } = renderHook(() => useHasRole("administrator"));

    expect(result.current).toBe(false);
  });

  it("returns false (fail-closed) when there is no user", () => {
    mockUseAuth.mockReturnValue({ user: undefined });

    const { result } = renderHook(() => useHasRole("administrator"));

    expect(result.current).toBe(false);
  });

  it("returns false (fail-closed) when roles is undefined", () => {
    mockUseAuth.mockReturnValue({ user: { roles: undefined } });

    const { result } = renderHook(() => useHasRole("administrator"));

    expect(result.current).toBe(false);
  });

  it("returns true for a user granted administrator via a custom PORTAL_ADMIN_GROUPS binding server-side", () => {
    // The client never sees the group binding — only the resolved role.
    mockUseAuth.mockReturnValue({ user: { roles: ["administrator"] } });

    const { result } = renderHook(() => useHasRole("administrator"));

    expect(result.current).toBe(true);
  });
});
