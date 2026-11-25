import type { ActorRow } from "@my-project/shared";
import type { MatchFunctions } from "@/core/providers/Filter";
import { AGENT_FILTER_NAMES } from "../../../../../constants/agentFilter";
import { ALL_FILTER_VALUE, actorStateMatch, agentProfileMatch, codebaseMatch } from "../../../../../utils/fleetFilter";
import type { AgentFilterValues } from "./types";

export const agentFilterDefaultValues: AgentFilterValues = {
  [AGENT_FILTER_NAMES.CODEBASE]: ALL_FILTER_VALUE,
  [AGENT_FILTER_NAMES.AGENT_PROFILE]: ALL_FILTER_VALUE,
  [AGENT_FILTER_NAMES.ACTOR_STATE]: ALL_FILTER_VALUE,
};

export const agentMatchFunctions: MatchFunctions<ActorRow, AgentFilterValues> = {
  [AGENT_FILTER_NAMES.CODEBASE]: codebaseMatch,
  [AGENT_FILTER_NAMES.AGENT_PROFILE]: agentProfileMatch,
  [AGENT_FILTER_NAMES.ACTOR_STATE]: actorStateMatch,
};
