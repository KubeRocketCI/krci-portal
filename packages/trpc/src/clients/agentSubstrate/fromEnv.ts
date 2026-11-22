import { GrpcAgentSubstrateSource } from "./grpc/index.js";
import type { AgentSubstrateSource } from "./source.js";

/** Mount path of the projected volume that the Helm chart adds with AGENT_SUBSTRATE_URL. */
export const AGENT_SUBSTRATE_MOUNT_PATH = "/var/run/agent-substrate";

/** The one adapter of the server. Undefined when AGENT_SUBSTRATE_URL is unset or empty: Agent Substrate is not configured. */
export function createAgentSubstrateSource(env: NodeJS.ProcessEnv): AgentSubstrateSource | undefined {
  const url = env.AGENT_SUBSTRATE_URL?.trim();
  if (!url) return undefined;

  return new GrpcAgentSubstrateSource({
    url,
    tokenFile: `${AGENT_SUBSTRATE_MOUNT_PATH}/token`,
    caFile: `${AGENT_SUBSTRATE_MOUNT_PATH}/ca.crt`,
  });
}
