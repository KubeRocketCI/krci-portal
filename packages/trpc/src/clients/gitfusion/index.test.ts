import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { HttpStatusError } from "../http/index.js";
import { GitFusionClient } from "./index.js";

const originalEnv = process.env;

describe("createGitFusionClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw when GITFUSION_URL is not set", async () => {
    delete process.env.GITFUSION_URL;
    const { createGitFusionClient } = await import("./index.js");

    expect(() => createGitFusionClient()).toThrow("GITFUSION_URL");
  });

  it("should return client when env is configured", async () => {
    process.env.GITFUSION_URL = "https://gitfusion.example.com";
    const { createGitFusionClient } = await import("./index.js");

    const client = createGitFusionClient();

    expect(client).toBeDefined();
    expect(typeof client.getRepositories).toBe("function");
    expect(typeof client.getOrganizations).toBe("function");
  });
});

describe("GitFusionClient", () => {
  it("should throw when apiBaseURL is empty", () => {
    expect(
      () =>
        new GitFusionClient({
          apiBaseURL: "",
        })
    ).toThrow("API base URL is not configured");
  });

  it("should create instance with valid config and strip trailing slash", () => {
    const client = new GitFusionClient({
      apiBaseURL: "https://gitfusion.example.com/",
    });
    expect(client).toBeInstanceOf(GitFusionClient);
  });
});

describe("GitFusionClient upstream errors", () => {
  function stubFetch(response: Response) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  }

  async function getBranchesError(): Promise<TRPCError> {
    const client = new GitFusionClient({ apiBaseURL: "https://gitfusion.example.com" });
    return (await client
      .getBranches("github-main", "fake-org", "fake-repo")
      .catch((caught: unknown) => caught)) as TRPCError;
  }

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("maps a rejected stored token (502 problem+json) to BAD_GATEWAY carrying the request id", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Bad Gateway",
          status: 502,
          detail: "git provider rejected the token",
        }),
        {
          status: 502,
          statusText: "Bad Gateway",
          headers: { "Content-Type": "application/problem+json", "X-Request-Id": "gf-pod/abc123-000042" },
        }
      )
    );

    const error = await getBranchesError();

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("BAD_GATEWAY");
    expect(error.cause).toBeInstanceOf(HttpStatusError);
    expect((error.cause as HttpStatusError).requestId).toBe("gf-pod/abc123-000042");
  });

  it("maps a 401 without a request id to FORBIDDEN", async () => {
    stubFetch(
      new Response(JSON.stringify({ code: "401", message: "bad credentials" }), {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/json" },
      })
    );

    const error = await getBranchesError();

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.cause).toBeInstanceOf(HttpStatusError);
    expect((error.cause as HttpStatusError).requestId).toBeUndefined();
  });
});
