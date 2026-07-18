import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import type { DBSessionStore } from "@/clients/db-session-store/index.js";
import {
  createMockedDBSessionStore,
  createMockedNotificationsStore,
} from "@my-project/trpc/__mocks__/context.js";
import { mockSession } from "@my-project/trpc/__mocks__/session.js";
import type { CustomSession } from "@my-project/trpc";

const stubCaller = vi.hoisted(() => ({}));

vi.mock("@my-project/trpc", async (importActual) => {
  const actual = await importActual<typeof import("@my-project/trpc")>();
  return {
    ...actual,
    createContext: vi.fn().mockReturnValue({}),
    createCaller: vi.fn().mockReturnValue(stubCaller),
  };
});

import { notificationEventBus } from "@my-project/trpc";
import { notificationEventSchema } from "@my-project/shared";
import { registerOpenApi } from "./openapi.js";
import { registerInternalEventsRoute } from "./internalEvents.js";
import sensorGoldenPayload from "./__fixtures__/argo-events-notification.json";

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

const VALID_EVENT = {
  id: "evt-1",
  type: "pipelinerun.failed",
  severity: "error",
  title: "Build pipeline failed",
  body: "PipelineRun review-test-go-app-main-xyz failed in namespace krci",
  namespace: "krci",
  link: "/c/default/pipelineruns/review-test-go-app-main-xyz",
  timestamp: "2026-07-18T10:00:00Z",
};

function buildFastify(
  notificationsStore: ReturnType<typeof createMockedNotificationsStore>
): FastifyInstance {
  const app = Fastify({ logger: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.decorateRequest("session", null as any);

  registerInternalEventsRoute(app, { notificationsStore });

  // registerOpenApi serves /rest/v1/openapi.json for the contract test below.
  registerOpenApi(app, {
    sessionStore: MOCK_SESSION_STORE,
    notificationsStore,
    oidcConfig: MOCK_OIDC_CONFIG,
    portalUrl: "http://localhost:8000",
  });

  return app;
}

let app: FastifyInstance;
let notificationsStore: ReturnType<typeof createMockedNotificationsStore>;
let originalToken: string | undefined;

beforeEach(async () => {
  vi.clearAllMocks();
  originalToken = process.env.INTERNAL_EVENTS_TOKEN;
  process.env.INTERNAL_EVENTS_TOKEN = "shared-secret";

  notificationsStore = createMockedNotificationsStore();
  app = buildFastify(notificationsStore);
  await app.ready();
});

afterEach(async () => {
  process.env.INTERNAL_EVENTS_TOKEN = originalToken;
  await app.close();
});

describe("POST /rest/v1/internal/events", () => {
  it("responds 503 when INTERNAL_EVENTS_TOKEN is unset", async () => {
    delete process.env.INTERNAL_EVENTS_TOKEN;

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "anything" },
      payload: VALID_EVENT,
    });

    expect(res.statusCode).toBe(503);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });

  it("responds 401 when the token header is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      payload: VALID_EVENT,
    });

    expect(res.statusCode).toBe(401);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });

  it("responds 401 when the token header does not match", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "wrong-secret" },
      payload: VALID_EVENT,
    });

    expect(res.statusCode).toBe(401);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });

  it("responds 400 for a body that fails schema validation", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "shared-secret" },
      payload: { ...VALID_EVENT, id: "" },
    });

    expect(res.statusCode).toBe(400);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });

  it("inserts, publishes on the event bus, and responds 204 for a valid event", async () => {
    const busListener = vi.fn();
    notificationEventBus.onNotification(busListener);

    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "shared-secret" },
      payload: VALID_EVENT,
    });

    notificationEventBus.offNotification(busListener);

    expect(res.statusCode).toBe(204);
    expect(notificationsStore.insert).toHaveBeenCalledWith(VALID_EVENT);
    expect(busListener).toHaveBeenCalledWith(VALID_EVENT);
  });

  it("responds 400 when `link` is not an app-relative path", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "shared-secret" },
      payload: { ...VALID_EVENT, link: "https://evil.example.com/phish" },
    });

    expect(res.statusCode).toBe(400);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });

  it("responds 400 when `link` is a protocol-relative URL", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "shared-secret" },
      payload: { ...VALID_EVENT, link: "//evil.example.com/phish" },
    });

    expect(res.statusCode).toBe(400);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });

  it("responds 400 when `link` is a backslash protocol-relative URL", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "shared-secret" },
      payload: { ...VALID_EVENT, link: "/\\evil.example.com/phish" },
    });

    expect(res.statusCode).toBe(400);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });

  it("responds 400 for a malformed (non-JSON) body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: {
        "x-internal-events-token": "shared-secret",
        "content-type": "application/json",
      },
      payload: "{not valid json",
    });

    expect(res.statusCode).toBe(400);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });

  it("responds 413 when the body exceeds the route body limit", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "shared-secret" },
      payload: { ...VALID_EVENT, body: "x".repeat(64 * 1024) },
    });

    expect(res.statusCode).toBe(413);
    expect(notificationsStore.insert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Contract tests — pin the agreed Sensor↔portal payload contract
// ---------------------------------------------------------------------------

describe("internal events contract", () => {
  it("accepts the golden fixture of the exact payload the Argo Events Sensor sends", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "shared-secret" },
      payload: sensorGoldenPayload,
    });

    expect(res.statusCode).toBe(204);
    expect(notificationsStore.insert).toHaveBeenCalledWith(sensorGoldenPayload);
  });

  it("tolerant reader: ignores unknown fields a newer Sensor may send", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/rest/v1/internal/events",
      headers: { "x-internal-events-token": "shared-secret" },
      payload: { ...sensorGoldenPayload, futureField: "from-a-newer-sensor" },
    });

    expect(res.statusCode).toBe(204);
    expect(notificationsStore.insert).toHaveBeenCalledWith(sensorGoldenPayload);
  });

  it("publishes the endpoint in the OpenAPI document, in sync with the Zod schema", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/rest/v1/openapi.json",
    });
    expect(res.statusCode).toBe(200);

    const doc = res.json();
    const operation = doc.paths?.["/v1/internal/events"]?.post;
    expect(operation).toBeDefined();
    expect(operation.security).toEqual([{ internalEventsToken: [] }]);
    expect(doc.components.securitySchemes.internalEventsToken).toMatchObject({
      type: "apiKey",
      in: "header",
      name: "x-internal-events-token",
    });

    // Drift guard: the hand-authored OpenAPI schema must mirror the Zod
    // contract — same property set, same required set.
    const documented = operation.requestBody.content["application/json"].schema;
    const shape = notificationEventSchema.shape;
    const zodKeys = Object.keys(shape).sort();
    const zodRequired = Object.keys(shape)
      .filter((key) => !shape[key as keyof typeof shape].isOptional())
      .sort();

    expect(Object.keys(documented.properties).sort()).toEqual(zodKeys);
    expect([...documented.required].sort()).toEqual(zodRequired);
  });
});
