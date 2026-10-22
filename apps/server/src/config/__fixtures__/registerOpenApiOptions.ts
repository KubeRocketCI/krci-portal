import type { CustomSession } from "@my-project/trpc";
import {
  createMockedDBSessionStore,
  createMockedNotificationsStore,
} from "@my-project/trpc/__mocks__/context.js";
import { mockSession } from "@my-project/trpc/__mocks__/session.js";
import type { RegisterOpenApiOptions } from "../openapi.js";

/** `registerOpenApi` options for tests. */
export function createRegisterOpenApiOptions(): RegisterOpenApiOptions {
  return {
    sessionStore: createMockedDBSessionStore(
      mockSession as unknown as CustomSession
    ),
    notificationsStore: createMockedNotificationsStore(),
    oidcConfig: {
      issuerURL: "https://oidc.example.com",
      clientID: "client-id",
      clientSecret: "client-secret",
      scope: "openid",
      codeChallengeMethod: "S256",
    },
    portalUrl: "http://localhost:8000",
  };
}
