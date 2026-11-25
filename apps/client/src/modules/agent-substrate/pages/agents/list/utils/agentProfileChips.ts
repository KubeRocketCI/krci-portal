import type { ActorRow } from "@my-project/shared";
import type { SelectOption } from "@/core/components/form";
import { AGENT_FILTER_NAMES, agentProfileFilterValue } from "../../../../constants/agentFilter";
import { ALL_FILTER_VALUE, agentProfileOptions } from "../../../../utils/fleetFilter";
import { agentMatchFunctions } from "../components/AgentFilter/constants";
import type { AgentFilterValues } from "../components/AgentFilter/types";

export interface AgentProfileChip {
  /** The agent profile filter value. */
  value: string;
  label: SelectOption["label"];
  count: number;
}

/** True when every filter except the agent profile filter keeps the actor. */
function matchesOtherFilters(actor: ActorRow, values: AgentFilterValues): boolean {
  return (Object.keys(agentMatchFunctions) as (keyof AgentFilterValues)[]).every(
    (name) => name === AGENT_FILTER_NAMES.AGENT_PROFILE || (agentMatchFunctions[name]?.(actor, values[name]) ?? true)
  );
}

/**
 * One chip for each option of `agentProfileOptions`, All first. A count is of the agents that the other filters keep.
 * Actors that host no agent are not counted.
 */
export function agentProfileChips(actors: ActorRow[], values: AgentFilterValues): AgentProfileChip[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const actor of actors) {
    if (!actor.agent || !matchesOtherFilters(actor, values)) continue;
    total += 1;
    const value = agentProfileFilterValue(actor.agent.agentProfile);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return agentProfileOptions(actors).map(({ label, value }) => ({
    value,
    label,
    count: value === ALL_FILTER_VALUE ? total : (counts.get(value) ?? 0),
  }));
}
