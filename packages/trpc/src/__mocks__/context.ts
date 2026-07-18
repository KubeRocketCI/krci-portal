import { createMockedK8sClient, MockK8sClient } from "./k8s-client.js";
import { createMockedOIDCClient } from "./oidc-client.js";
import { mockSession } from "./session.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { CustomSession } from "../context/types.js";
import { vi } from "vitest";
import { INotificationsStore, ISessionStore } from "@my-project/shared";
import type { OIDCConfig } from "../clients/oidc/index.js";

export function createMockedDBSessionStore(mockSession: CustomSession): ISessionStore {
  return {
    get: vi.fn((sessionId, callback) => {
      callback(null, mockSession);
    }),
    set: vi.fn((sessionId, session, callback) => {
      callback(null);
    }),
    destroy: vi.fn((sessionId, callback) => {
      callback(null);
    }),
    cleanup: vi.fn(),
  };
}

export function createMockedNotificationsStore(): INotificationsStore {
  return {
    insert: vi.fn(),
    list: vi.fn().mockReturnValue([]),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    cleanup: vi.fn(),
  };
}

interface MockedContext {
  req: FastifyRequest;
  res: FastifyReply;
  session: CustomSession;
  K8sClient: MockK8sClient;
  oidcClient: ReturnType<typeof createMockedOIDCClient>;
  sessionStore: ReturnType<typeof createMockedDBSessionStore>;
  notificationsStore: ReturnType<typeof createMockedNotificationsStore>;
  oidcConfig: OIDCConfig;
  portalUrl: string;
}

export function createMockedContext(): MockedContext {
  // Fresh clone per call — a shared session reference would leak test
  // mutations (unset user, changed groups) across tests.
  const session = structuredClone(mockSession) as unknown as CustomSession;

  const mockK8sClient = createMockedK8sClient(session);
  const mockOIDCClient = createMockedOIDCClient();

  const mockSessionStore = createMockedDBSessionStore(session);
  const mockNotificationsStore = createMockedNotificationsStore();

  const mockOidcConfig: OIDCConfig = {
    issuerURL: "https://mock-issuer.example.com",
    clientID: "mock-client-id",
    clientSecret: "mock-client-secret",
    scope: "openid profile email",
    codeChallengeMethod: "S256",
  };

  return {
    req: {} as FastifyRequest,
    res: {} as FastifyReply,
    session,
    K8sClient: mockK8sClient,
    oidcClient: mockOIDCClient,
    sessionStore: mockSessionStore,
    notificationsStore: mockNotificationsStore,
    oidcConfig: mockOidcConfig,
    portalUrl: "http://localhost:8000",
  };
}
