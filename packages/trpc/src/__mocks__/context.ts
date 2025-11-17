import { createMockedK8sClient, MockK8sClient } from "./k8s-client";
import { createMockedOIDCClient } from "./oidc-client";
import { mockSession } from "./session";
import { FastifyReply, FastifyRequest } from "fastify";
import { CustomSession } from "../context/types";
import { vi } from "vitest";
import { ISessionStore } from "@my-project/shared";
import type { OIDCConfig } from "../clients/oidc";

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

interface MockedContext {
  req: FastifyRequest;
  res: FastifyReply;
  session: CustomSession;
  K8sClient: MockK8sClient;
  oidcClient: ReturnType<typeof createMockedOIDCClient>;
  sessionStore: ReturnType<typeof createMockedDBSessionStore>;
  oidcConfig: OIDCConfig;
}

export function createMockedContext(): MockedContext {
  // Mock session object matching the SQLite DB structure

  const mockK8sClient = createMockedK8sClient(mockSession as unknown as CustomSession);
  const mockOIDCClient = createMockedOIDCClient();

  const mockSessionStore = createMockedDBSessionStore(mockSession as unknown as CustomSession);

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
    session: mockSession as unknown as CustomSession,
    K8sClient: mockK8sClient,
    oidcClient: mockOIDCClient,
    sessionStore: mockSessionStore,
    oidcConfig: mockOidcConfig,
  };
}
