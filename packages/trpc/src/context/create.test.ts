import { describe, expect, it } from "vitest";
import { createContext } from "./create.js";

describe("createContext", () => {
  it("should return context with all provided fields", () => {
    const req = {} as any;
    const res = {} as any;
    const session = { user: null } as any;
    const sessionStore = {} as any;
    const oidcConfig = {
      issuerURL: "https://issuer.example.com",
      clientID: "client-id",
      clientSecret: "secret",
      scope: "openid",
      codeChallengeMethod: "S256",
    };
    const portalUrl = "https://portal.example.com";

    const ctx = createContext({
      req,
      res,
      session,
      sessionStore,
      oidcConfig,
      portalUrl,
    });

    expect(ctx).toEqual({
      req,
      res,
      session,
      sessionStore,
      oidcConfig,
      portalUrl,
    });
  });
});
