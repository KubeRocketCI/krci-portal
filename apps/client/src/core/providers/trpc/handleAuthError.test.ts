import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRouterState, mockShowToast } = vi.hoisted(() => ({
  mockRouterState: { location: { pathname: "/some-page" } },
  mockShowToast: vi.fn(),
}));

vi.mock("../../router", () => ({
  router: { state: mockRouterState },
}));

vi.mock("../../auth/pages/login/route", () => ({
  routeAuthLogin: { fullPath: "/auth/login" },
}));

vi.mock("../../auth/pages/callback/route", () => ({
  routeAuthCallback: { fullPath: "/auth/callback" },
}));

vi.mock("../../components/Snackbar", () => ({
  showToast: mockShowToast,
}));

import { handleAuthError, REDIRECT_DEBOUNCE_MS } from "./handleAuthError";

const LOGIN_URL = "/auth/login?redirect=%2Fsome-page&reason=session-expired";

describe("handleAuthError", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockRouterState.location.pathname = "/some-page";
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true, configurable: true });
  });

  afterEach(async () => {
    // Lets the redirect debounce expire between tests.
    await vi.advanceTimersByTimeAsync(REDIRECT_DEBOUNCE_MS + 100);
    vi.useRealTimers();
  });

  it("shows a toast and sends the browser to login with the current path", () => {
    handleAuthError();

    expect(mockShowToast).toHaveBeenCalledWith("Session expired. Please log in again.", "warning", { duration: 4000 });
    expect(window.location.href).toBe(LOGIN_URL);
  });

  it.each(["/auth/login", "/auth/callback"])("does nothing on %s", (pathname) => {
    mockRouterState.location.pathname = pathname;

    handleAuthError();

    expect(mockShowToast).not.toHaveBeenCalled();
    expect(window.location.href).toBe("");
  });

  it("redirects once per debounce window", async () => {
    handleAuthError();
    window.location.href = "";

    handleAuthError();
    expect(mockShowToast).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe("");

    await vi.advanceTimersByTimeAsync(REDIRECT_DEBOUNCE_MS);
    handleAuthError();
    expect(mockShowToast).toHaveBeenCalledTimes(2);
    expect(window.location.href).toBe(LOGIN_URL);
  });
});
