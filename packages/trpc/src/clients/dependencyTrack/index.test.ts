import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { DependencyTrackClient } from "./index.js";

const originalEnv = process.env;

describe("createDependencyTrackClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw when DEPENDENCY_TRACK_URL is not set", async () => {
    delete process.env.DEPENDENCY_TRACK_URL;
    const { createDependencyTrackClient } = await import("./index.js");

    expect(() => createDependencyTrackClient()).toThrow("DEPENDENCY_TRACK_URL");
  });

  it("attaches sca_not_configured cause when DEPENDENCY_TRACK_URL is missing", async () => {
    delete process.env.DEPENDENCY_TRACK_URL;
    const { createDependencyTrackClient } = await import("./index.js");

    let caught: unknown;
    try {
      createDependencyTrackClient();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(TRPCError);
    const trpcErr = caught as TRPCError;
    expect(trpcErr.code).toBe("INTERNAL_SERVER_ERROR");
    // TRPCError wraps plain objects in an UnknownCauseError instance, so use
    // objectContaining rather than a deep-equality check on the constructor.
    expect(trpcErr.cause).toMatchObject({
      kind: "sca_not_configured",
      missing: "DEPENDENCY_TRACK_URL",
    });
  });

  it("should throw when DEPENDENCY_TRACK_API_KEY is not set", async () => {
    process.env.DEPENDENCY_TRACK_URL = "https://dt.example.com";
    delete process.env.DEPENDENCY_TRACK_API_KEY;
    const { createDependencyTrackClient } = await import("./index.js");

    expect(() => createDependencyTrackClient()).toThrow("DEPENDENCY_TRACK_API_KEY");
  });

  it("attaches sca_not_configured cause when DEPENDENCY_TRACK_API_KEY is missing", async () => {
    process.env.DEPENDENCY_TRACK_URL = "https://dt.example.com";
    delete process.env.DEPENDENCY_TRACK_API_KEY;
    const { createDependencyTrackClient } = await import("./index.js");

    let caught: unknown;
    try {
      createDependencyTrackClient();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(TRPCError);
    const trpcErr = caught as TRPCError;
    expect(trpcErr.code).toBe("INTERNAL_SERVER_ERROR");
    // TRPCError wraps plain objects in an UnknownCauseError instance, so use
    // objectContaining rather than a deep-equality check on the constructor.
    expect(trpcErr.cause).toMatchObject({
      kind: "sca_not_configured",
      missing: "DEPENDENCY_TRACK_API_KEY",
    });
  });

  it("should return client when env is configured", async () => {
    process.env.DEPENDENCY_TRACK_URL = "https://dt.example.com";
    process.env.DEPENDENCY_TRACK_API_KEY = "api-key";
    const { createDependencyTrackClient } = await import("./index.js");

    const client = createDependencyTrackClient();

    expect(client).toBeDefined();
    expect(typeof client.getProjects).toBe("function");
    expect(typeof client.getProject).toBe("function");
  });
});

describe("DependencyTrackClient", () => {
  it("should throw when apiBaseURL is empty", () => {
    expect(
      () =>
        new DependencyTrackClient({
          apiBaseURL: "",
          apiKey: "key",
        })
    ).toThrow("API base URL is not configured");
  });

  it("should throw when apiKey is empty", () => {
    expect(
      () =>
        new DependencyTrackClient({
          apiBaseURL: "https://dt.example.com",
          apiKey: "",
        })
    ).toThrow("API key is not configured");
  });

  it("should create instance with valid config", () => {
    const client = new DependencyTrackClient({
      apiBaseURL: "https://dt.example.com",
      apiKey: "key",
    });
    expect(client).toBeInstanceOf(DependencyTrackClient);
  });

  describe("x-total-count", () => {
    const client = new DependencyTrackClient({
      apiBaseURL: "https://dt.example.com",
      apiKey: "key",
    });

    function stubListResponse(headers?: HeadersInit) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200, headers })));
    }

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("getProjects reads totalCount from the x-total-count header", async () => {
      stubListResponse({ "x-total-count": "42" });

      await expect(client.getProjects({ pageNumber: 0, pageSize: 25 })).resolves.toEqual({
        projects: [],
        totalCount: 42,
      });
    });

    it("getProjects throws when x-total-count is absent", async () => {
      stubListResponse();

      await expect(client.getProjects({ pageNumber: 0, pageSize: 25 })).rejects.toThrow(
        "Dependency Track response has no valid X-Total-Count header (got null)"
      );
    });

    it.each(["42broken", "1.5", "-1", "", "NaN"])(
      "getProjects throws for a malformed x-total-count (%j)",
      async (raw) => {
        stubListResponse({ "x-total-count": raw });

        await expect(client.getProjects({ pageNumber: 0, pageSize: 25 })).rejects.toThrow(
          `Dependency Track response has no valid X-Total-Count header (got ${JSON.stringify(raw)})`
        );
      }
    );
  });
});
