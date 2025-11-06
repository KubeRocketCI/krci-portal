import type { FastifySessionObject } from "@fastify/session";
import type { ISessionStore, OIDCUser } from "@my-project/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { OIDCConfig } from "../clients/oidc";

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
  oidcConfig: OIDCConfig;
}
