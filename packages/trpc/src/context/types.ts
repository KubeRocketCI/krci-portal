import type { FastifySessionObject } from "@fastify/session";
import type { AuthSource, INotificationsStore, ISessionStore, OIDCUser } from "@my-project/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { OIDCConfig } from "../clients/oidc/index.js";

// Session type
export type CustomSession = FastifySessionObject & {
  login:
    | {
        openId: {
          state: string | undefined;
          codeVerifier: string | undefined;
        };
        clientSearch: string | undefined;
      }
    | undefined;
  user:
    | {
        data: OIDCUser | undefined;
        // Which identity provider established this session. Gates portal-role
        // resolution: only `oidc` sessions carry roles (see `resolvePortalRoles`).
        authSource: AuthSource;
        secret: {
          idToken: string;
          idTokenExpiresAt: number;
          accessToken: string;
          accessTokenExpiresAt: number;
          refreshToken: string;
        };
      }
    | undefined;
};

export interface TRPCContext {
  req: FastifyRequest;
  res: FastifyReply;
  session: CustomSession;
  sessionStore: ISessionStore;
  notificationsStore: INotificationsStore;
  oidcConfig: OIDCConfig;
  portalUrl: string;
}
