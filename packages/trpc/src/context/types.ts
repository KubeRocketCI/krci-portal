import type { FastifyRequest, FastifyReply } from "fastify";
import type { FastifySessionObject } from "@fastify/session";
import type { OIDCUser, ISessionStore } from "@my-project/shared";
import { K8sClient } from "../clients/k8s";
import { OIDCClient } from "../clients/oidc";

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

// Main tRPC Context Interface
export interface TRPCContext {
  req: FastifyRequest;
  res: FastifyReply;
  session: CustomSession;
  K8sClient: K8sClient;
  oidcClient: OIDCClient;
  sessionStore: ISessionStore;
}
