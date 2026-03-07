import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted to ensure mocks are set up before modules load
const { mockNavigate, mockRouterState, mockShowToast } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockRouterState: {
      location: {
        pathname: "/some-page",
      },
    },
    mockShowToast: vi.fn(),
  };
});

// Mock the router before importing any modules
vi.mock("../../router", () => ({
  router: {
    navigate: mockNavigate,
    state: mockRouterState,
  },
}));

// Mock the route imports
vi.mock("../../auth/pages/login/route", () => ({
  routeAuthLogin: {
    fullPath: "/auth/login",
  },
}));

vi.mock("../../auth/pages/callback/route", () => ({
  routeAuthCallback: {
    fullPath: "/auth/callback",
  },
}));

// Mock the Snackbar component
vi.mock("../../components/Snackbar", () => ({
  showToast: mockShowToast,
}));

import { customFetch } from "./utils";

describe("customFetch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Reset the pathname to default
    mockRouterState.location.pathname = "/some-page";

    // Mock window.location.href using Object.defineProperty
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(async () => {
    // Fast-forward past the 1000ms timeout in handleAuthError to reset isRedirecting flag
    await vi.advanceTimersByTimeAsync(1100);
    vi.useRealTimers();
  });

  describe("HTTP status code handling", () => {
    it("should redirect to login on 401 status", async () => {
      const mockResponse = new Response(null, { status: 401 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).toHaveBeenCalledWith("Session expired. Please log in again.", "warning", {
        duration: 4000,
      });
      expect(window.location.href).toBe("/auth/login?redirect=%2Fsome-page&reason=session-expired");
    });

    it("should not redirect on 200 status with no errors", async () => {
      const mockResponse = new Response(JSON.stringify({ result: { data: "success" } }), {
        status: 200,
      });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });
  });

  describe("tRPC single response error handling", () => {
    it("should redirect on UNAUTHORIZED error code", async () => {
      const errorResponse = {
        error: {
          code: "UNAUTHORIZED",
        },
      };
      const mockResponse = new Response(JSON.stringify(errorResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).toHaveBeenCalledWith("Session expired. Please log in again.", "warning", {
        duration: 4000,
      });
      expect(window.location.href).toBe("/auth/login?redirect=%2Fsome-page&reason=session-expired");
    });

    it("should redirect on UNAUTHORIZED in error.data.code", async () => {
      const errorResponse = {
        error: {
          data: {
            code: "UNAUTHORIZED",
          },
        },
      };
      const mockResponse = new Response(JSON.stringify(errorResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).toHaveBeenCalledWith("Session expired. Please log in again.", "warning", {
        duration: 4000,
      });
      expect(window.location.href).toBe("/auth/login?redirect=%2Fsome-page&reason=session-expired");
    });

    it("should NOT redirect on FORBIDDEN error code", async () => {
      const errorResponse = {
        error: {
          code: "FORBIDDEN",
        },
      };
      const mockResponse = new Response(JSON.stringify(errorResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should NOT redirect on K8s API errors (source: k8s)", async () => {
      const errorResponse = {
        error: {
          code: "FORBIDDEN",
          data: {
            source: "k8s",
            statusCode: 401,
          },
        },
      };
      const mockResponse = new Response(JSON.stringify(errorResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should not redirect on other error codes", async () => {
      const errorResponse = {
        error: {
          code: "BAD_REQUEST",
          data: {
            httpStatus: 400,
          },
        },
      };
      const mockResponse = new Response(JSON.stringify(errorResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });
  });

  describe("tRPC batch response error handling", () => {
    it("should redirect when any item in batch has auth error", async () => {
      const batchResponse = [
        { result: { data: "success" } },
        {
          error: {
            code: "UNAUTHORIZED",
          },
        },
        { result: { data: "another success" } },
      ];
      const mockResponse = new Response(JSON.stringify(batchResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).toHaveBeenCalledWith("Session expired. Please log in again.", "warning", {
        duration: 4000,
      });
      expect(window.location.href).toBe("/auth/login?redirect=%2Fsome-page&reason=session-expired");
    });

    it("should NOT redirect when batch has K8s errors", async () => {
      const batchResponse = [
        { result: { data: "success" } },
        {
          error: {
            code: "FORBIDDEN",
            data: {
              source: "k8s",
              statusCode: 401,
            },
          },
        },
      ];
      const mockResponse = new Response(JSON.stringify(batchResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should not redirect when batch has no auth errors", async () => {
      const batchResponse = [
        { result: { data: "success" } },
        {
          error: {
            code: "BAD_REQUEST",
          },
        },
        { result: { data: "another success" } },
      ];
      const mockResponse = new Response(JSON.stringify(batchResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should handle empty batch response", async () => {
      const batchResponse: unknown[] = [];
      const mockResponse = new Response(JSON.stringify(batchResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle non-JSON responses gracefully", async () => {
      const mockResponse = new Response("plain text response", { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should handle malformed JSON gracefully", async () => {
      const mockResponse = new Response("{ invalid json", { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should handle empty response body", async () => {
      const mockResponse = new Response(null, { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should return the original response", async () => {
      const mockResponse = new Response(JSON.stringify({ result: { data: "test" } }), {
        status: 200,
      });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await customFetch("http://test.com/api", {});

      expect(result).toBe(mockResponse);
    });
  });

  describe("redirect prevention logic", () => {
    it("should not redirect when already on login page", async () => {
      // Mock being on login page
      mockRouterState.location.pathname = "/auth/login";

      const mockResponse = new Response(null, { status: 401 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should not redirect when already on callback page", async () => {
      // Mock being on callback page
      mockRouterState.location.pathname = "/auth/callback";

      const mockResponse = new Response(null, { status: 401 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });

    it("should prevent multiple redirects with debounce", async () => {
      // Fake timers already active from beforeEach
      const mockResponse1 = new Response(null, { status: 401 });
      const mockResponse2 = new Response(null, { status: 401 });
      global.fetch = vi.fn().mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      // First call should redirect
      await customFetch("http://test.com/api", {});
      expect(mockShowToast).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe("/auth/login?redirect=%2Fsome-page&reason=session-expired");

      // Reset window.location for next test
      window.location.href = "";

      // Second call immediately after should not redirect (debounced)
      await customFetch("http://test.com/api", {});
      expect(mockShowToast).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe("");

      // After timeout, should allow redirect again
      await vi.advanceTimersByTimeAsync(1000);

      const mockResponse3 = new Response(null, { status: 401 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse3);

      await customFetch("http://test.com/api", {});
      expect(mockShowToast).toHaveBeenCalledTimes(2);
      expect(window.location.href).toBe("/auth/login?redirect=%2Fsome-page&reason=session-expired");
    });
  });

  describe("multiple error condition combinations", () => {
    it("should handle error with both UNAUTHORIZED code and 401 httpStatus", async () => {
      const errorResponse = {
        error: {
          code: "UNAUTHORIZED",
          data: {
            code: "UNAUTHORIZED",
            httpStatus: 401,
          },
        },
      };
      const mockResponse = new Response(JSON.stringify(errorResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).toHaveBeenCalledWith("Session expired. Please log in again.", "warning", {
        duration: 4000,
      });
      expect(window.location.href).toBe("/auth/login?redirect=%2Fsome-page&reason=session-expired");
    });

    it("should handle response without error property", async () => {
      const successResponse = {
        result: {
          data: {
            id: 1,
            name: "test",
          },
        },
      };
      const mockResponse = new Response(JSON.stringify(successResponse), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await customFetch("http://test.com/api", {});

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    });
  });
});
