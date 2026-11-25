import type { INotificationsStore, ISessionStore } from "@my-project/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { CustomSession, TRPCContext } from "./types.js";
import type { OIDCConfig } from "../clients/oidc/index.js";
import type { AgentSubstrateSource } from "../clients/agentSubstrate/index.js";
import type { ReviewRunSource } from "../clients/reviewRuns/index.js";

export function createContext({
  req,
  res,
  session,
  sessionStore,
  notificationsStore,
  agentSubstrateSource,
  reviewRunSource,
  oidcConfig,
  portalUrl,
}: {
  req: FastifyRequest;
  res: FastifyReply;
  session: CustomSession;
  sessionStore: ISessionStore;
  notificationsStore: INotificationsStore;
  agentSubstrateSource?: AgentSubstrateSource;
  reviewRunSource?: ReviewRunSource;
  oidcConfig: OIDCConfig;
  portalUrl: string;
}): TRPCContext {
  return {
    req,
    res,
    session,
    sessionStore,
    notificationsStore,
    agentSubstrateSource,
    reviewRunSource,
    oidcConfig,
    portalUrl,
  };
}
