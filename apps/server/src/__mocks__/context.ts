import { CustomSession } from "@/trpc/context";
import { createMockedK8sClient, MockK8sClient } from "./k8s-client";
import { createMockedDBSessionStore } from "./db-session-store";
import { createMockedOIDCClient } from "./oidc-client";
import { mockSession } from "./session";
import { FastifyReply, FastifyRequest } from "fastify";

interface MockedContext {
  req: FastifyRequest;
  res: FastifyReply;
  session: CustomSession;
  K8sClient: MockK8sClient;
  oidcClient: ReturnType<typeof createMockedOIDCClient>;
  sessionStore: ReturnType<typeof createMockedDBSessionStore>;
}

export function createMockedContext(): MockedContext {
  // Mock session object matching the SQLite DB structure

  const mockK8sClient = createMockedK8sClient(
    mockSession as unknown as CustomSession
  );
  const mockOIDCClient = createMockedOIDCClient();

  const mockSessionStore = createMockedDBSessionStore(
    mockSession as unknown as CustomSession
  );

  return {
    req: {} as FastifyRequest,
    res: {} as FastifyReply,
    session: mockSession as unknown as CustomSession,
    K8sClient: mockK8sClient,
    oidcClient: mockOIDCClient,
    sessionStore: mockSessionStore,
  };
}
