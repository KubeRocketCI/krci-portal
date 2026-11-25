import { describe, expect, it } from "vitest";
import { createContext } from "./create.js";
import { MemoryAgentSubstrateSource } from "../clients/agentSubstrate/index.js";
import { MemoryReviewRunSource } from "../clients/reviewRuns/index.js";

describe("createContext", () => {
  it("should return context with all provided fields", () => {
    const req = {} as any;
    const res = {} as any;
    const session = { user: null } as any;
    const sessionStore = {} as any;
    const notificationsStore = {} as any;
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
      notificationsStore,
      oidcConfig,
      portalUrl,
    });

    expect(ctx).toEqual({
      req,
      res,
      session,
      sessionStore,
      notificationsStore,
      oidcConfig,
      portalUrl,
    });
  });

  it("forwards the Agent Substrate source", () => {
    const agentSubstrateSource = new MemoryAgentSubstrateSource();

    const ctx = createContext({
      req: {} as any,
      res: {} as any,
      session: { user: null } as any,
      sessionStore: {} as any,
      notificationsStore: {} as any,
      agentSubstrateSource,
      oidcConfig: { issuerURL: "", clientID: "", clientSecret: "", scope: "", codeChallengeMethod: "" },
      portalUrl: "https://portal.example.com",
    });

    expect(ctx.agentSubstrateSource).toBe(agentSubstrateSource);
  });

  it("forwards the review run source", () => {
    const reviewRunSource = new MemoryReviewRunSource();

    const ctx = createContext({
      req: {} as any,
      res: {} as any,
      session: { user: null } as any,
      sessionStore: {} as any,
      notificationsStore: {} as any,
      reviewRunSource,
      oidcConfig: { issuerURL: "", clientID: "", clientSecret: "", scope: "", codeChallengeMethod: "" },
      portalUrl: "https://portal.example.com",
    });

    expect(ctx.reviewRunSource).toBe(reviewRunSource);
  });
});
