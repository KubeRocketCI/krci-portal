import { ACTOR_STATE_GROUP, type ActorRow } from "@my-project/shared";
import type { MatchFunctions } from "@/core/providers/Filter";
import { ACTOR_FILTER_NAMES, agentProfileFilterValue } from "../../../../../constants/actorFilter";
import type { ActorFilterValues } from "./types";

/** `_` cannot be in atespace, Codebase or agent profile names, so this value cannot collide with one. */
export const ALL_FILTER_VALUE = "__all__";

export const actorFilterDefaultValues: ActorFilterValues = {
  [ACTOR_FILTER_NAMES.ATESPACE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.CODEBASE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.AGENT_PROFILE]: ALL_FILTER_VALUE,
};

/** The router parses an unquoted numeric search value, such as `?agentProfile=17`, to a number. */
const exactMatch =
  (valueOf: (actor: ActorRow) => string | undefined) =>
  (actor: ActorRow, value: string): boolean =>
    !value || value === ALL_FILTER_VALUE || valueOf(actor) === String(value);

export const actorMatchFunctions: MatchFunctions<ActorRow, ActorFilterValues> = {
  [ACTOR_FILTER_NAMES.ATESPACE]: exactMatch((actor) => actor.atespace),
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: exactMatch((actor) => ACTOR_STATE_GROUP[actor.state]),
  [ACTOR_FILTER_NAMES.CODEBASE]: exactMatch((actor) => actor.agent?.codebase?.name),
  /** An actor that the dispatcher did not make matches no agent profile. */
  [ACTOR_FILTER_NAMES.AGENT_PROFILE]: exactMatch((actor) =>
    actor.agent ? agentProfileFilterValue(actor.agent.agentProfile) : undefined
  ),
};
