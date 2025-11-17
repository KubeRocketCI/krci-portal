import type { ISessionStore } from "@my-project/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { CustomSession, TRPCContext } from "./types.js";
import type { OIDCConfig } from "../clients/oidc/index.js";

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
  oidcConfig: OIDCConfig;
}): TRPCContext {
  return {
    req,
    res,
    session,
    sessionStore,
    oidcConfig,
  };
}
