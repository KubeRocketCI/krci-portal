import { ACTOR_STATE_GROUP, type ActorRow } from "@my-project/shared";
import type { MatchFunctions } from "@/core/providers/Filter";
import { ACTOR_FILTER_NAMES, agentProfileFilterValue } from "../../../../../constants/actorFilter";
import { placementWorkerPool } from "../../../../../utils/roomLabel";
import type { ActorFilterValues } from "./types";

/** `_` cannot be in atespace, Codebase, agent profile or worker pool names, so this value cannot collide with one. */
export const ALL_FILTER_VALUE = "__all__";

export const actorFilterDefaultValues: ActorFilterValues = {
  [ACTOR_FILTER_NAMES.ATESPACE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.CODEBASE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.AGENT_PROFILE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.WORKER_POOL]: ALL_FILTER_VALUE,
};

/**
 * `normalizeUrlValues` of the Actors page. The router JSON-parses each search value, so a hand-typed `?agentProfile=007`
 * arrives as the number 7 and `=null` as null. A filter value that is not a string is taken from the URL text instead.
 */
export function withRawSearchValues(searchStr: string) {
  const raw = new URLSearchParams(searchStr);
  return (values: Partial<ActorFilterValues>): Partial<ActorFilterValues> => {
    const restored = { ...values };
    for (const name of Object.values(ACTOR_FILTER_NAMES)) {
      const text = raw.get(name);
      if (text !== null && typeof restored[name] !== "string") restored[name] = text;
    }
    return restored;
  };
}

const exactMatch =
  (valueOf: (actor: ActorRow) => string | undefined) =>
  (actor: ActorRow, value: string): boolean =>
    !value || value === ALL_FILTER_VALUE || valueOf(actor) === value;

export const actorMatchFunctions: MatchFunctions<ActorRow, ActorFilterValues> = {
  [ACTOR_FILTER_NAMES.ATESPACE]: exactMatch((actor) => actor.atespace),
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: exactMatch((actor) => ACTOR_STATE_GROUP[actor.state]),
  [ACTOR_FILTER_NAMES.CODEBASE]: exactMatch((actor) => actor.agent?.codebase?.name),
  [ACTOR_FILTER_NAMES.AGENT_PROFILE]: exactMatch((actor) =>
    actor.agent ? agentProfileFilterValue(actor.agent.agentProfile) : undefined
  ),
  [ACTOR_FILTER_NAMES.WORKER_POOL]: exactMatch((actor) => placementWorkerPool(actor.placement)),
};
