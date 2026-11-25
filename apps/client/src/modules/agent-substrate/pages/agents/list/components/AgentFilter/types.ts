import type { AGENT_FILTER_NAMES } from "../../../../../constants/agentFilter";

export type AgentFilterValues = {
  [AGENT_FILTER_NAMES.CODEBASE]: string;
  [AGENT_FILTER_NAMES.AGENT_PROFILE]: string;
  /** `ActorStateGroup`, not `ActorState`. */
  [AGENT_FILTER_NAMES.ACTOR_STATE]: string;
};
