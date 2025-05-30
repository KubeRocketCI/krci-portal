import { FastifySessionObject } from "@fastify/session";
import type { OIDCUser } from "@my-project/shared";
import { FastifyRequest, FastifyReply } from "fastify";
import { TRPCError } from "@trpc/server";
import { K8sClient } from "@/clients/k8s";
import { OIDCClient } from "@/clients/oidc";
import { DBSessionStore } from "@/clients/db-session-store";

export type CustomSession = FastifySessionObject & {
  login:
    | {
        openId: {
          state: string | undefined;
          codeVerifier: string | undefined;
        };
        clientSearch: string | undefined;
      }
    | undefined; // when login callback is handled, so state and codeVerifier are no longer needed
  user:
    | {
        data: OIDCUser | undefined;
        secret: {
          idToken: string; // used for kubernetes network
          idTokenExpiresAt: number; // ms
          accessToken: string; // used for keycloak communication
          accessTokenExpiresAt: number; // ms
          refreshToken: string;
        };
      }
    | undefined;
};

export const createContext = async ({
  req,
  res,
  oidcClient,
  sessionStore,
  K8sClient,
}: {
  req: FastifyRequest;
  res: FastifyReply;
  oidcClient: OIDCClient;
  sessionStore: DBSessionStore;
  K8sClient: K8sClient;
}) => {
  const requestSession = req.session as CustomSession;

  const context = {
    session: requestSession,
    req,
    res,
    oidcClient,
    sessionStore,
    K8sClient,
  };

  if (!context.session?.user) return context;

  const { idTokenExpiresAt, accessTokenExpiresAt, refreshToken } =
    context.session.user.secret;

  // If access_token is expired, destroy session
  if (accessTokenExpiresAt && Date.now() >= accessTokenExpiresAt) {
    try {
      context.session.destroy();
    } catch (err) {
      console.error("Failed to remove expired session:", err);
    }
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
  }

  // If either token is about to expire, refresh it
  const refreshTokensIfNeeded = async (
    tokenExpiresAt: number,
    tokenType: string
  ) => {
    if (tokenExpiresAt && Date.now() >= tokenExpiresAt - 5 * 60 * 1000) {
      try {
        const config = await oidcClient.discover();
        const newTokens = await oidcClient.getNewTokens(config, refreshToken);
        context.session.user!.secret = newTokens;
      } catch (err) {
        console.error(`Failed to refresh ${tokenType}:`, err);
        context.session.destroy();
      }
    }
  };

  await Promise.all([
    refreshTokensIfNeeded(idTokenExpiresAt, "id_token"),
    refreshTokensIfNeeded(accessTokenExpiresAt, "access_token"),
  ]);

  return context;
};

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
