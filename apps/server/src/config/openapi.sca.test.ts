// Integration tests for the four SCA REST routes registered by registerOpenApi:
//   GET /rest/v1/sca/list
//   GET /rest/v1/sca/get
//   GET /rest/v1/sca/components
//   GET /rest/v1/sca/findings
//
// Mocking strategy: `@my-project/trpc` is mocked at module level so that
// `createCaller` returns a stub caller whose individual procedure methods can
// be configured per-test. `createContext` is a no-op that returns an empty
// object (the stub caller never actually reads the context).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { TRPCError } from "@trpc/server";
import type { DBSessionStore } from "@/clients/db-session-store/index.js";
import { createMockedDBSessionStore } from "@my-project/trpc/__mocks__/context.js";
import { mockSession } from "@my-project/trpc/__mocks__/session.js";
import type { CustomSession } from "@my-project/trpc";

// ---------------------------------------------------------------------------
// Module mock — must be declared before any import that transitively imports
// the real @my-project/trpc so Vitest can hoist it correctly.
//
// `vi.hoisted` runs before the vi.mock factory (which itself is hoisted to the
// top of the file), so `stubCaller` is available when the factory closure
// executes. Without vi.hoisted the closure would see an uninitialized binding.
// ---------------------------------------------------------------------------

const stubCaller = vi.hoisted(() => ({
  dependencyTrack: {
    getProjects: vi.fn(),
    getProjectByNameAndVersion: vi.fn(),
    getProjectMetrics: vi.fn(),
    getComponents: vi.fn(),
    getFindingsByProject: vi.fn(),
  },
  k8s: {
    get: vi.fn(),
  },
}));

vi.mock("@my-project/trpc", async (importActual) => {
  // Spread the real module so type-only re-exports (TRPCError, etc.) remain
  // available; only replace the caller factory and context creator.
  const actual = await importActual<typeof import("@my-project/trpc")>();
  return {
    ...actual,
    createContext: vi.fn().mockReturnValue({}),
    createCaller: vi.fn().mockReturnValue(stubCaller),
  };
});

// Import AFTER mocks are declared so Vitest resolves the mocked module.
import { registerOpenApi } from "./openapi.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// `registerOpenApi` accepts DBSessionStore (a concrete class). In tests we
// never reach any code path that calls methods on the store because createCaller
// is fully mocked, so a cast is safe here.
const MOCK_SESSION_STORE = createMockedDBSessionStore(
  mockSession as unknown as CustomSession
) as unknown as DBSessionStore;

const MOCK_OIDC_CONFIG = {
  issuerURL: "https://oidc.example.com",
  clientID: "client-id",
  clientSecret: "client-secret",
  scope: "openid",
  codeChallengeMethod: "S256",
};

function buildFastify(): FastifyInstance {
  const app = Fastify({ logger: false });

  // The routes read `req.session` inside buildCaller. createContext is mocked
  // to return {} so the value is never consumed, but the property accessor must
  // not throw. Fastify's `decorateRequest` with an object getter-setter covers
  // this; `null` is not accepted by the typings, so we cast via unknown.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.decorateRequest("session", null as any);

  registerOpenApi(app, {
    sessionStore: MOCK_SESSION_STORE,
    oidcConfig: MOCK_OIDC_CONFIG,
    portalUrl: "http://localhost:8000",
  });

  return app;
}

/** A minimal DependencyTrack project fixture. */
const MOCK_PROJECT = {
  uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  name: "my-service",
  version: "main",
  metrics: {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    unassigned: 0,
    vulnerabilities: 6,
    components: 42,
  },
};

/** A minimal finding fixture. */
function makeFinding(severity: string, name: string, vulnId: string) {
  return {
    component: { name },
    vulnerability: { severity, vulnId, description: "desc" },
    analysis: { isSuppressed: false },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /rest/v1/sca/list", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildFastify();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("happy path — returns items and totalCount from caller", async () => {
    stubCaller.dependencyTrack.getProjects.mockResolvedValue({
      projects: [MOCK_PROJECT],
      totalCount: 1,
    });

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/list",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ items: unknown[]; totalCount: number }>();
    expect(body.items).toHaveLength(1);
    expect(body.totalCount).toBe(1);
    expect(body.items[0]).toMatchObject({ uuid: MOCK_PROJECT.uuid });
  });

  it("returns 400 when pageNumber is not a positive integer", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/list?pageNumber=abc",
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/pageNumber/);
  });
});

describe("GET /rest/v1/sca/get", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildFastify();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("happy path — returns project and latest metrics snapshot", async () => {
    // k8s.get resolves branch from codebase CR
    stubCaller.k8s.get.mockResolvedValue({
      spec: { defaultBranch: "main" },
    });
    stubCaller.dependencyTrack.getProjectByNameAndVersion.mockResolvedValue(
      MOCK_PROJECT
    );
    stubCaller.dependencyTrack.getProjectMetrics.mockResolvedValue([
      { critical: 0, high: 0 },
      { critical: 1, high: 2 },
    ]);

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/get?codebase=my-service",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{
      status: string;
      project: { uuid: string };
      metrics: unknown;
    }>();
    expect(body.status).toBe("OK");
    expect(body.project.uuid).toBe(MOCK_PROJECT.uuid);
    // latestMetricsSnapshot returns the last element of the series
    expect(body.metrics).toEqual({ critical: 1, high: 2 });
  });

  it("returns 400 when codebase query param is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/get",
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/codebase/);
  });

  it("returns 503 when Dep-Track is not configured", async () => {
    stubCaller.k8s.get.mockResolvedValue({ spec: { defaultBranch: "main" } });
    stubCaller.dependencyTrack.getProjectByNameAndVersion.mockRejectedValue(
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "DEPENDENCY_TRACK_URL environment variable is not configured",
        cause: { kind: "sca_not_configured", missing: "DEPENDENCY_TRACK_URL" },
      })
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/get?codebase=my-service&branch=main",
    });

    expect(res.statusCode).toBe(503);
    const body = res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("returns 404 when codebase CR does not exist", async () => {
    stubCaller.k8s.get.mockRejectedValue(
      new TRPCError({ code: "NOT_FOUND", message: "not found" })
    );

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/get?codebase=missing-svc",
    });

    expect(res.statusCode).toBe(404);
    const body = res.json<{ reason: string }>();
    expect(body.reason).toBe("codebase_not_found");
  });
});

describe("GET /rest/v1/sca/components", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildFastify();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("happy path — returns component list with totalCount", async () => {
    stubCaller.k8s.get.mockResolvedValue({ spec: { defaultBranch: "main" } });
    stubCaller.dependencyTrack.getProjectByNameAndVersion.mockResolvedValue(
      MOCK_PROJECT
    );
    stubCaller.dependencyTrack.getComponents.mockResolvedValue({
      components: [{ uuid: "comp-1", name: "lodash", version: "4.17.21" }],
      totalCount: 1,
    });

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/components?codebase=my-service&branch=main",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{
      status: string;
      items: unknown[];
      totalCount: number;
    }>();
    expect(body.status).toBe("OK");
    expect(body.items).toHaveLength(1);
    expect(body.totalCount).toBe(1);
  });

  it("returns 400 when codebase is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/components",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toMatch(/codebase/);
  });

  it("returns 400 when pageNumber is invalid", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/components?codebase=my-service&pageNumber=0",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toMatch(/pageNumber/);
  });
});

describe("GET /rest/v1/sca/findings", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildFastify();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("happy path — returns sorted findings with truncated flag", async () => {
    stubCaller.k8s.get.mockResolvedValue({ spec: { defaultBranch: "main" } });
    stubCaller.dependencyTrack.getProjectByNameAndVersion.mockResolvedValue(
      MOCK_PROJECT
    );
    stubCaller.dependencyTrack.getFindingsByProject.mockResolvedValue([
      makeFinding("LOW", "axios", "CVE-2023-001"),
      makeFinding("CRITICAL", "lodash", "CVE-2022-002"),
    ]);

    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/findings?codebase=my-service&branch=main",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{
      status: string;
      items: Array<{ vulnerability: { severity: string } }>;
      truncated: boolean;
    }>();
    expect(body.status).toBe("OK");
    expect(body.truncated).toBe(false);
    // CRITICAL should be sorted first
    expect(body.items[0]?.vulnerability.severity).toBe("CRITICAL");
  });

  it("returns 400 when codebase is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/sca/findings",
    });

    expect(res.statusCode).toBe(400);
    expect(res.json<{ error: string }>().error).toMatch(/codebase/);
  });
});
