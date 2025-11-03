import type { FastifyRequest, FastifyReply } from "fastify";
import { K8sClient } from "../clients/k8s";
import { OIDCClient } from "../clients/oidc";
import type { CustomSession, TRPCContext } from "./types";
import type { ISessionStore } from "@my-project/shared";

export function createContext({
  req,
  res,
  session,
  sessionStore,
  oidcConfig,
}: {
  req: FastifyRequest;
  res: FastifyReply;
  session: CustomSession;
  sessionStore: ISessionStore;
  oidcConfig: {
    issuerURL: string;
    clientID: string;
    clientSecret: string;
    scope: string;
    codeChallengeMethod: string;
  };
}): TRPCContext {
  return {
    req,
    res,
    session,
    sessionStore,
    K8sClient: new K8sClient(session),
    oidcClient: new OIDCClient(oidcConfig),
  };
}
