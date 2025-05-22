import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { FastifyRequest, FastifyReply } from "fastify";
import { TRPCError } from "@trpc/server";
import { OIDCClient } from "@/clients/oidc";
import { DBSessionStore } from "@/clients/db-session-store";
import { K8sClient } from "@/clients/k8s";
import { createContext, CustomSession } from ".";
import * as openidClient from "openid-client";

// Mock dependencies
vi.mock("@/clients/oidc");
vi.mock("@/clients/db-session-store");
vi.mock("@/clients/k8s");

describe("createContext", () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let mockOidcClient: {
    discover: Mock;
    getNewTokens: Mock;
  };
  let mockSessionStore: DBSessionStore;
  let mockK8sClient: K8sClient;
  let mockSession: CustomSession;

  beforeEach(() => {
    mockSession = {
      login: undefined,
      user: undefined,
      destroy: vi.fn().mockResolvedValue(undefined),
    } as unknown as CustomSession;

    mockRequest = {
      session: mockSession,
    } as unknown as FastifyRequest;

    mockReply = {} as FastifyReply;

    mockOidcClient = {
      discover: vi.fn(),
      getNewTokens: vi.fn(),
    };

    mockSessionStore = {} as DBSessionStore;
    mockK8sClient = {} as K8sClient;

    vi.clearAllMocks();
  });

  it("should return context without user session if no user exists", async () => {
    const context = await createContext({
      req: mockRequest,
      res: mockReply,
      oidcClient: mockOidcClient as unknown as OIDCClient,
      sessionStore: mockSessionStore,
      K8sClient: mockK8sClient,
    });

    expect(context).toEqual({
      session: mockSession,
      req: mockRequest,
      res: mockReply,
      oidcClient: mockOidcClient,
      sessionStore: mockSessionStore,
      K8sClient: mockK8sClient,
    });
    expect(mockSession.destroy).not.toHaveBeenCalled();
    expect(mockOidcClient.getNewTokens).not.toHaveBeenCalled();
  });

  it("should destroy session and throw UNAUTHORIZED if access token is expired", async () => {
    mockSession.user = {
      data: undefined,
      secret: {
        idToken: "id-token",
        idTokenExpiresAt: Date.now() + 10000,
        accessToken: "access-token",
        accessTokenExpiresAt: Date.now() - 10000, // Expired
        refreshToken: "refresh-token",
      },
    };

    await expect(
      createContext({
        req: mockRequest,
        res: mockReply,
        oidcClient: mockOidcClient as unknown as OIDCClient,
        sessionStore: mockSessionStore,
        K8sClient: mockK8sClient,
      })
    ).rejects.toThrowError(
      new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" })
    );

    expect(mockSession.destroy).toHaveBeenCalled();
    expect(mockOidcClient.getNewTokens).not.toHaveBeenCalled();
  });

  it("should refresh tokens if id_token is about to expire", async () => {
    const now = Date.now();
    const newTokens = {
      idToken: "new-id-token",
      idTokenExpiresAt: now + 3600000,
      accessToken: "new-access-token",
      accessTokenExpiresAt: now + 3600000,
      refreshToken: "new-refresh-token",
    };

    mockSession.user = {
      data: undefined,
      secret: {
        idToken: "id-token",
        idTokenExpiresAt: now + 4 * 60 * 1000, // About to expire (within 5 minutes)
        accessToken: "access-token",
        accessTokenExpiresAt: now + 10 * 60 * 1000, // Not expiring soon
        refreshToken: "refresh-token",
      },
    };

    mockOidcClient.discover.mockResolvedValue({} as openidClient.Configuration);
    mockOidcClient.getNewTokens.mockResolvedValue(newTokens);

    const context = await createContext({
      req: mockRequest,
      res: mockReply,
      oidcClient: mockOidcClient as unknown as OIDCClient,
      sessionStore: mockSessionStore,
      K8sClient: mockK8sClient,
    });

    expect(mockOidcClient.discover).toHaveBeenCalled();
    expect(mockOidcClient.getNewTokens).toHaveBeenCalledWith(
      {},
      "refresh-token"
    );
    expect(mockSession.user!.secret).toEqual(newTokens);
    expect(context.session).toBe(mockSession);
    expect(mockSession.destroy).not.toHaveBeenCalled();
  });

  it("should destroy session if token refresh fails", async () => {
    const now = Date.now();
    mockSession.user = {
      data: undefined,
      secret: {
        idToken: "id-token",
        idTokenExpiresAt: now + 4 * 60 * 1000, // About to expire
        accessToken: "access-token",
        accessTokenExpiresAt: now + 10 * 60 * 1000,
        refreshToken: "refresh-token",
      },
    };

    mockOidcClient.discover.mockResolvedValue({} as openidClient.Configuration);
    mockOidcClient.getNewTokens.mockRejectedValue(new Error("Refresh failed"));

    const context = await createContext({
      req: mockRequest,
      res: mockReply,
      oidcClient: mockOidcClient as unknown as OIDCClient,
      sessionStore: mockSessionStore,
      K8sClient: mockK8sClient,
    });

    expect(mockOidcClient.discover).toHaveBeenCalled();
    expect(mockOidcClient.getNewTokens).toHaveBeenCalled();
    expect(mockSession.destroy).toHaveBeenCalled();
    expect(context.session.user).toBeDefined(); // Session still exists but tokens not updated
  });

  it("should handle both tokens needing refresh", async () => {
    const now = Date.now();
    const newTokens = {
      idToken: "new-id-token",
      idTokenExpiresAt: now + 3600000,
      accessToken: "new-access-token",
      accessTokenExpiresAt: now + 3600000,
      refreshToken: "new-refresh-token",
    };

    mockSession.user = {
      data: undefined,
      secret: {
        idToken: "id-token",
        idTokenExpiresAt: now + 4 * 60 * 1000, // About to expire
        accessToken: "access-token",
        accessTokenExpiresAt: now + 4 * 60 * 1000, // About to expire
        refreshToken: "refresh-token",
      },
    };

    mockOidcClient.discover.mockResolvedValue({} as openidClient.Configuration);
    mockOidcClient.getNewTokens.mockResolvedValue(newTokens);

    const context = await createContext({
      req: mockRequest,
      res: mockReply,
      oidcClient: mockOidcClient as unknown as OIDCClient,
      sessionStore: mockSessionStore,
      K8sClient: mockK8sClient,
    });

    expect(mockOidcClient.discover).toHaveBeenCalled();
    expect(mockOidcClient.getNewTokens).toHaveBeenCalledTimes(2); // Once for each token
    expect(mockSession.user!.secret).toEqual(newTokens);
    expect(context.session).toBe(mockSession);
    expect(mockSession.destroy).not.toHaveBeenCalled();
  });

  it("should not refresh tokens if they are not close to expiring", async () => {
    const now = Date.now();
    mockSession.user = {
      data: undefined,
      secret: {
        idToken: "id-token",
        idTokenExpiresAt: now + 10 * 60 * 1000, // Not expiring soon
        accessToken: "access-token",
        accessTokenExpiresAt: now + 10 * 60 * 1000, // Not expiring soon
        refreshToken: "refresh-token",
      },
    };

    const context = await createContext({
      req: mockRequest,
      res: mockReply,
      oidcClient: mockOidcClient as unknown as OIDCClient,
      sessionStore: mockSessionStore,
      K8sClient: mockK8sClient,
    });

    expect(mockOidcClient.discover).not.toHaveBeenCalled();
    expect(mockOidcClient.getNewTokens).not.toHaveBeenCalled();
    expect(mockSession.destroy).not.toHaveBeenCalled();
    expect(context.session).toBe(mockSession);
  });
});
