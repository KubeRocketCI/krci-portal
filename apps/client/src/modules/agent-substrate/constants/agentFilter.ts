/** The Agents page filters. Values are the URL search param names. */
export const AGENT_FILTER_NAMES = {
  CODEBASE: "codebase",
  AGENT_PROFILE: "agentProfile",
  ACTOR_STATE: "actorState",
} as const;

/**
 * The agent profile filter value for agents whose actor template sets no `AGENT_PROFILE`. Agent profile names are
 * `[a-z0-9-]`, so it cannot collide with one.
 */
const NO_AGENT_PROFILE_FILTER_VALUE = "__none__";

const NO_AGENT_PROFILE_LABEL = "No agent profile";

/** The agent profile filter value of an agent; null: its actor template sets no `AGENT_PROFILE`. */
export const agentProfileFilterValue = (agentProfile: string | null): string =>
  agentProfile ?? NO_AGENT_PROFILE_FILTER_VALUE;

export const agentProfileLabel = (agentProfile: string | null): string => agentProfile ?? NO_AGENT_PROFILE_LABEL;
