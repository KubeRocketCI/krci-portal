// Integration tests for the three security REST routes registered by
// registerOpenApi:
//   GET /rest/v1/security/get
//   GET /rest/v1/security/env
//   GET /rest/v1/security/findings
//
// `@my-project/trpc` is mocked at module level: `createCaller` returns a stub
// caller whose procedures are configured per test.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { TRPCError } from "@trpc/server";
import {
  HttpNotConfiguredError,
  HttpStatusError,
  HttpTimeoutError,
} from "@my-project/trpc";
import { createRegisterOpenApiOptions } from "./__fixtures__/registerOpenApiOptions.js";

const stubCaller = vi.hoisted(() => ({
  security: {
    getCodebaseSummary: vi.fn(),
    getEnvironmentSummary: vi.fn(),
    listFindings: vi.fn(),
  },
}));

vi.mock("@my-project/trpc", async (importActual) => {
  const actual = await importActual<typeof import("@my-project/trpc")>();
  return {
    ...actual,
    createContext: vi.fn().mockReturnValue({}),
    createCaller: vi.fn().mockReturnValue(stubCaller),
  };
});

// Import AFTER mocks are declared so Vitest resolves the mocked module.
import { registerOpenApi } from "./openapi.js";

const SENTINEL = "SENTINEL-LEAK";

const COUNTS = { critical: 0, high: 1, medium: 2, low: 3, unassigned: 4 };

function buildFastify(): FastifyInstance {
  const app = Fastify({ logger: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.decorateRequest("session", null as any);
  registerOpenApi(app, createRegisterOpenApiOptions());
  return app;
}

function wrappedByTrpc(cause: Error): TRPCError {
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: SENTINEL,
    cause,
  });
}

let app: FastifyInstance;

beforeEach(async () => {
  for (const fn of Object.values(stubCaller.security)) {
    fn.mockReset();
  }
  app = buildFastify();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

describe("GET /rest/v1/security/get", () => {
  it("answers the summary of the codebase", async () => {
    const summary = {
      status: "OK",
      codebase: "my-service",
      ci: [],
      runtime: [],
    };
    stubCaller.security.getCodebaseSummary.mockResolvedValue(summary);

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/get?codebase=my-service",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(summary);
    expect(stubCaller.security.getCodebaseSummary).toHaveBeenCalledWith({
      codebase: "my-service",
    });
  });

  it("answers 400 without codebase", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/get",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "codebase is required" });
    expect(stubCaller.security.getCodebaseSummary).not.toHaveBeenCalled();
  });

  it("answers the 400 envelope when the procedure rejects the input", async () => {
    stubCaller.security.getCodebaseSummary.mockRejectedValue(
      new TRPCError({ code: "BAD_REQUEST", message: SENTINEL })
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/get?codebase=Not_A_Name",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: { code: "BAD_REQUEST", message: "Bad Request" },
    });
    expect(res.body).not.toContain(SENTINEL);
  });

  it("answers 403 when the caller may not read the codebase", async () => {
    stubCaller.security.getCodebaseSummary.mockRejectedValue(
      new TRPCError({ code: "FORBIDDEN", message: SENTINEL })
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/get?codebase=my-service",
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({
      error: { code: "FORBIDDEN", message: "Forbidden" },
    });
    expect(res.body).not.toContain(SENTINEL);
  });

  it("answers 404 with the reason when the codebase does not exist", async () => {
    stubCaller.security.getCodebaseSummary.mockRejectedValue(
      new TRPCError({
        code: "NOT_FOUND",
        message: SENTINEL,
        cause: { source: "k8s", reason: "codebase_not_found" },
      })
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/get?codebase=missing",
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        reason: "codebase_not_found",
        message: "Not Found",
      },
    });
  });

  it("answers 503 when DefectDojo is not configured", async () => {
    stubCaller.security.getCodebaseSummary.mockRejectedValue(
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "DEFECTDOJO_URL environment variable is not configured",
        cause: new HttpNotConfiguredError("DefectDojo"),
      })
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/get?codebase=my-service",
    });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "DefectDojo integration is not configured",
      },
    });
  });

  it("answers 502 when DefectDojo answers with an error", async () => {
    stubCaller.security.getCodebaseSummary.mockRejectedValue(
      wrappedByTrpc(
        new HttpStatusError({
          service: "DefectDojo",
          url: `https://${SENTINEL}/api/v2/products/`,
          status: 500,
          statusText: SENTINEL,
          body: SENTINEL,
        })
      )
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/get?codebase=my-service",
    });

    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({
      error: { code: "BAD_GATEWAY", message: "Bad Gateway" },
    });
    expect(res.body).not.toContain(SENTINEL);
  });

  it("answers 504 when DefectDojo times out", async () => {
    stubCaller.security.getCodebaseSummary.mockRejectedValue(
      wrappedByTrpc(new HttpTimeoutError("DefectDojo", 30_000, true))
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/get?codebase=my-service",
    });

    expect(res.statusCode).toBe(504);
    expect(res.json()).toEqual({
      error: { code: "GATEWAY_TIMEOUT", message: "Gateway Timeout" },
    });
  });
});

describe("GET /rest/v1/security/env", () => {
  it("answers the summary of the environment", async () => {
    const summary = {
      status: "OK",
      environment: "demo/dev",
      applications: [
        {
          codebase: "my-service",
          workloads: ["deployment/my-service"],
          versions: ["main-1"],
          counts: COUNTS,
          link: "https://dd.example.com/engagement/4",
        },
      ],
    };
    stubCaller.security.getEnvironmentSummary.mockResolvedValue(summary);

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/env?cdPipeline=demo&stage=dev",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(summary);
    expect(stubCaller.security.getEnvironmentSummary).toHaveBeenCalledWith({
      cdPipeline: "demo",
      stage: "dev",
    });
  });

  it.each([
    ["/rest/v1/security/env?stage=dev", "cdPipeline is required"],
    ["/rest/v1/security/env?cdPipeline=demo", "stage is required"],
  ])("answers 400 for %s", async (url, error) => {
    const res = await app.inject({ method: "GET", url });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error });
    expect(stubCaller.security.getEnvironmentSummary).not.toHaveBeenCalled();
  });

  it("answers 403 when the caller may not read the stage", async () => {
    stubCaller.security.getEnvironmentSummary.mockRejectedValue(
      new TRPCError({ code: "FORBIDDEN", message: SENTINEL })
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/env?cdPipeline=demo&stage=dev",
    });

    expect(res.statusCode).toBe(403);
    expect(res.body).not.toContain(SENTINEL);
  });
});

describe("GET /rest/v1/security/findings", () => {
  const page = {
    status: "OK",
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
  };

  beforeEach(() => {
    stubCaller.security.listFindings.mockResolvedValue(page);
  });

  it("passes only the codebase and the scope when nothing else is given", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/findings?codebase=my-service&scope=ci",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(page);
    expect(stubCaller.security.listFindings).toHaveBeenCalledWith({
      codebase: "my-service",
      scope: "ci",
      environment: undefined,
      severity: undefined,
      page: undefined,
      pageSize: undefined,
    });
  });

  it("treats an empty environment as not given", async () => {
    await app.inject({
      method: "GET",
      url: "/rest/v1/security/findings?codebase=my-service&scope=ci&environment=",
    });

    expect(stubCaller.security.listFindings).toHaveBeenCalledWith(
      expect.objectContaining({ environment: undefined })
    );
  });

  it("passes every filter", async () => {
    await app.inject({
      method: "GET",
      url:
        "/rest/v1/security/findings?codebase=my-service&scope=runtime" +
        "&environment=demo/dev&severity=critical,high&page=2&pageSize=50",
    });

    expect(stubCaller.security.listFindings).toHaveBeenCalledWith({
      codebase: "my-service",
      scope: "runtime",
      environment: "demo/dev",
      severity: ["critical", "high"],
      page: 2,
      pageSize: 50,
    });
  });

  it("accepts a repeated severity parameter", async () => {
    await app.inject({
      method: "GET",
      url: "/rest/v1/security/findings?codebase=my-service&scope=ci&severity=low&severity=unassigned",
    });

    expect(stubCaller.security.listFindings).toHaveBeenCalledWith(
      expect.objectContaining({ severity: ["low", "unassigned"] })
    );
  });

  it.each([
    ["", "codebase is required"],
    ["codebase=a", "scope must be ci or runtime"],
    ["codebase=a&scope=prod", "scope must be ci or runtime"],
    [
      "codebase=a&scope=ci&severity=info",
      "severity must be a comma-separated list of critical|high|medium|low|unassigned",
    ],
    ["codebase=a&scope=ci&page=0", "page must be a positive integer"],
    ["codebase=a&scope=ci&page=x", "page must be a positive integer"],
    ["codebase=a&scope=ci&page=1001", "page must be at most 1000"],
    [`codebase=a&scope=ci&page=${"9".repeat(30)}`, "page must be at most 1000"],
    ["codebase=a&scope=ci&pageSize=-1", "pageSize must be a positive integer"],
  ])("answers 400 for ?%s", async (query, error) => {
    const res = await app.inject({
      method: "GET",
      url: `/rest/v1/security/findings?${query}`,
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error });
    expect(stubCaller.security.listFindings).not.toHaveBeenCalled();
  });

  it("answers 404 when the codebase does not exist", async () => {
    stubCaller.security.listFindings.mockRejectedValue(
      new TRPCError({ code: "NOT_FOUND", message: SENTINEL })
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/security/findings?codebase=missing&scope=ci",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).not.toContain(SENTINEL);
  });
});
