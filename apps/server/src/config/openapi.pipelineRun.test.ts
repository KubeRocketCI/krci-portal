import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { TRPCError } from "@trpc/server";
import type { DBSessionStore } from "@/clients/db-session-store/index.js";
import {
  createMockedDBSessionStore,
  createMockedNotificationsStore,
} from "@my-project/trpc/__mocks__/context.js";
import { mockSession } from "@my-project/trpc/__mocks__/session.js";
import type { CustomSession } from "@my-project/trpc";

const stubCaller = vi.hoisted(() => ({
  pipelineRun: {
    start: vi.fn(),
    build: vi.fn(),
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

import { registerOpenApi } from "./openapi.js";

const MOCK_SESSION_STORE = createMockedDBSessionStore(
  mockSession as unknown as CustomSession
) as unknown as DBSessionStore;

const MOCK_NOTIFICATIONS_STORE = createMockedNotificationsStore();

const MOCK_OIDC_CONFIG = {
  issuerURL: "https://oidc.example.com",
  clientID: "client-id",
  clientSecret: "client-secret",
  scope: "openid",
  codeChallengeMethod: "S256",
};

function buildFastify(): FastifyInstance {
  const app = Fastify({ logger: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.decorateRequest("session", null as any);

  registerOpenApi(app, {
    sessionStore: MOCK_SESSION_STORE,
    notificationsStore: MOCK_NOTIFICATIONS_STORE,
    oidcConfig: MOCK_OIDC_CONFIG,
    portalUrl: "http://localhost:8000",
  });

  return app;
}

const BASE_PAYLOAD = {
  namespace: "edp",
  pipeline: "foo-build",
};

describe("POST /rest/v1/pipelineruns/start", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildFastify();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("happy path — forwards body to caller.pipelineRun.start and returns created row", async () => {
    stubCaller.pipelineRun.start.mockResolvedValue({
      kind: "created",
      row: {
        name: "foo-build-run-x9k2p",
        status: "Pending",
        project: "my-app",
        pr: "",
        author: "",
        type: "build",
        started: "",
        duration: "",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/start",
      payload: {
        ...BASE_PAYLOAD,
        params: { "git-revision": "main" },
        labels: { "app.edp.epam.com/codebase": "my-app" },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ kind: string; row: { name: string } }>();
    expect(body.kind).toBe("created");
    expect(body.row.name).toBe("foo-build-run-x9k2p");
    expect(stubCaller.pipelineRun.start).toHaveBeenCalledWith(
      expect.objectContaining({
        pipeline: "foo-build",
        params: { "git-revision": "main" },
      })
    );
  });

  it("dry-run path — forwards dryRun=true and returns manifest", async () => {
    stubCaller.pipelineRun.start.mockResolvedValue({
      kind: "dryRun",
      manifest: { apiVersion: "tekton.dev/v1", kind: "PipelineRun" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/start",
      payload: { ...BASE_PAYLOAD, dryRun: true },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{
      kind: string;
      manifest: Record<string, unknown>;
    }>();
    expect(body.kind).toBe("dryRun");
    expect(body.manifest.kind).toBe("PipelineRun");
    expect(body.manifest.apiVersion).toBe("tekton.dev/v1");
  });

  it("Pipeline NOT_FOUND surfaces reason but never the verbatim message", async () => {
    stubCaller.pipelineRun.start.mockRejectedValue(
      new TRPCError({
        code: "NOT_FOUND",
        message: "pipeline 'ghost' not found",
        cause: { source: "k8s", reason: "pipeline_not_found" },
      })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/start",
      payload: { ...BASE_PAYLOAD, pipeline: "ghost" },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json<{
      error: { code: string; reason?: string; message: string };
    }>();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.reason).toBe("pipeline_not_found");
    expect(body.error.message).toBe("Not Found");
    // Regression: the verbatim message — including the pipeline name — must
    // never reach the wire.
    expect(res.body).not.toContain("ghost");
  });

  it("TriggerTemplate NOT_FOUND surfaces trigger_template_not_found reason", async () => {
    stubCaller.pipelineRun.start.mockRejectedValue(
      new TRPCError({
        code: "NOT_FOUND",
        message:
          "pipeline 'foo-build' references TriggerTemplate 'foo-tt' which does not exist",
        cause: { source: "k8s", reason: "trigger_template_not_found" },
      })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/start",
      payload: { ...BASE_PAYLOAD },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json<{
      error: { code: string; reason?: string; message: string };
    }>();
    expect(body.error.reason).toBe("trigger_template_not_found");
    expect(body.error.message).toBe("Not Found");
    expect(res.body).not.toContain("foo-tt");
  });

  it("malformed TT label — BAD_REQUEST surfaces malformed_trigger_template_label reason", async () => {
    stubCaller.pipelineRun.start.mockRejectedValue(
      new TRPCError({
        code: "BAD_REQUEST",
        message: "pipeline 'foo-build' has malformed TriggerTemplate label",
        cause: {
          source: "validation",
          reason: "malformed_trigger_template_label",
        },
      })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/start",
      payload: { ...BASE_PAYLOAD },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string; reason?: string } }>();
    expect(body.error.reason).toBe("malformed_trigger_template_label");
  });

  it("error response omits reason when cause does not provide one", async () => {
    stubCaller.pipelineRun.start.mockRejectedValue(
      new TRPCError({ code: "NOT_FOUND", message: "internal detail" })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/start",
      payload: { ...BASE_PAYLOAD, pipeline: "ghost" },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json<{
      error: { code: string; reason?: string; message: string };
    }>();
    expect(body.error.reason).toBeUndefined();
    expect(body.error.message).toBe("Not Found");
    expect(res.body).not.toContain("internal detail");
  });

  it("RBAC denied — TRPCError FORBIDDEN → HTTP 403", async () => {
    stubCaller.pipelineRun.start.mockRejectedValue(
      new TRPCError({ code: "FORBIDDEN", message: "permission denied" })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/start",
      payload: { ...BASE_PAYLOAD },
    });

    expect(res.statusCode).toBe(403);
  });

  it("upstream failure — TRPCError INTERNAL_SERVER_ERROR → HTTP 500", async () => {
    stubCaller.pipelineRun.start.mockRejectedValue(
      new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "boom" })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/start",
      payload: { ...BASE_PAYLOAD },
    });

    expect(res.statusCode).toBe(500);
  });
});

const BUILD_PAYLOAD = {
  namespace: "edp",
  codebase: "my-app",
};

describe("POST /rest/v1/pipelineruns/build", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildFastify();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("happy path — forwards body to caller.pipelineRun.build and returns created row", async () => {
    stubCaller.pipelineRun.build.mockResolvedValue({
      kind: "created",
      row: {
        name: "build-my-app-main-a1b2c-x9k2p",
        status: "Pending",
        project: "my-app",
        pr: "",
        author: "",
        type: "build",
        started: "",
        duration: "",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/build",
      payload: {
        ...BUILD_PAYLOAD,
        branch: "feat/x",
        params: { "image-tag": "v1" },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ kind: string; row: { name: string } }>();
    expect(body.kind).toBe("created");
    expect(body.row.name).toBe("build-my-app-main-a1b2c-x9k2p");
    expect(stubCaller.pipelineRun.build).toHaveBeenCalledWith({
      namespace: "edp",
      codebase: "my-app",
      branch: "feat/x",
      params: { "image-tag": "v1" },
    });
  });

  it("dry-run path — forwards dryRun=true and returns manifest", async () => {
    stubCaller.pipelineRun.build.mockResolvedValue({
      kind: "dryRun",
      manifest: { apiVersion: "tekton.dev/v1", kind: "PipelineRun" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/build",
      payload: { ...BUILD_PAYLOAD, dryRun: true },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{
      kind: string;
      manifest: Record<string, unknown>;
    }>();
    expect(body.kind).toBe("dryRun");
    expect(body.manifest.kind).toBe("PipelineRun");
    expect(stubCaller.pipelineRun.build).toHaveBeenCalledWith({
      namespace: "edp",
      codebase: "my-app",
      dryRun: true,
    });
  });

  it("managed param override — BAD_REQUEST carries the reason and the static phrase", async () => {
    stubCaller.pipelineRun.build.mockRejectedValue(
      new TRPCError({
        code: "BAD_REQUEST",
        message:
          "param 'git-source-url' is derived from the codebase and branch and cannot be overridden",
        cause: { source: "validation", reason: "managed_param_override" },
      })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/build",
      payload: {
        ...BUILD_PAYLOAD,
        params: { "git-source-url": "ssh://evil/repo" },
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json<{
      error: { code: string; reason?: string; message: string };
    }>();
    expect(body.error.reason).toBe("managed_param_override");
    expect(body.error.message).toBe("Bad Request");
    expect(res.body).not.toContain("evil");
  });

  it("branch not found — NOT_FOUND surfaces the reason but never the branch name", async () => {
    stubCaller.pipelineRun.build.mockRejectedValue(
      new TRPCError({
        code: "NOT_FOUND",
        message: "branch 'ghost' of codebase 'my-app' not found",
        cause: { source: "validation", reason: "codebase_branch_not_found" },
      })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/build",
      payload: { ...BUILD_PAYLOAD, branch: "ghost" },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json<{
      error: { code: string; reason?: string; message: string };
    }>();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.reason).toBe("codebase_branch_not_found");
    expect(body.error.message).toBe("Not Found");
    expect(res.body).not.toContain("codebase 'my-app' not found");
  });

  it("build already running — CONFLICT surfaces build_in_progress", async () => {
    stubCaller.pipelineRun.build.mockRejectedValue(
      new TRPCError({
        code: "CONFLICT",
        message:
          "a build is already running for branch 'main' of codebase 'my-app'",
        cause: { source: "validation", reason: "build_in_progress" },
      })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/build",
      payload: BUILD_PAYLOAD,
    });

    expect(res.statusCode).toBe(409);
    const body = res.json<{
      error: { code: string; reason?: string; message: string };
    }>();
    expect(body.error.reason).toBe("build_in_progress");
    expect(body.error.message).toBe("Conflict");
  });

  it("truncated list — INTERNAL_SERVER_ERROR surfaces list_truncated", async () => {
    stubCaller.pipelineRun.build.mockRejectedValue(
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "CodebaseBranch list in namespace 'edp' was truncated",
        cause: { source: "validation", reason: "list_truncated" },
      })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/build",
      payload: BUILD_PAYLOAD,
    });

    expect(res.statusCode).toBe(500);
    const body = res.json<{
      error: { code: string; reason?: string; message: string };
    }>();
    expect(body.error.reason).toBe("list_truncated");
    expect(body.error.message).toBe("Internal Server Error");
  });

  it("error response omits reason when cause does not provide one", async () => {
    stubCaller.pipelineRun.build.mockRejectedValue(
      new TRPCError({ code: "FORBIDDEN", message: "internal detail" })
    );

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/pipelineruns/build",
      payload: BUILD_PAYLOAD,
    });

    expect(res.statusCode).toBe(403);
    const body = res.json<{
      error: { code: string; reason?: string; message: string };
    }>();
    expect(body.error.reason).toBeUndefined();
    expect(body.error.message).toBe("Forbidden");
    expect(res.body).not.toContain("internal detail");
  });
});
