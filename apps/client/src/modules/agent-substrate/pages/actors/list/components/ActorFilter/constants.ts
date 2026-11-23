import { ACTOR_STATE_GROUP, type ActorRow } from "@my-project/shared";
import type { MatchFunctions } from "@/core/providers/Filter";
import type { ActorFilterValues } from "./types";

/** Values are the URL search param names. */
export const ACTOR_FILTER_NAMES = {
  ATESPACE: "atespace",
  ACTOR_STATE: "actorState",
  CODEBASE: "codebase",
} as const;

/** `_` cannot be in atespace or Codebase names, so this value cannot collide with one. */
export const ALL_FILTER_VALUE = "__all__";

export const actorFilterDefaultValues: ActorFilterValues = {
  [ACTOR_FILTER_NAMES.ATESPACE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.CODEBASE]: ALL_FILTER_VALUE,
};

const exactMatch =
  (valueOf: (actor: ActorRow) => string | undefined) =>
  (actor: ActorRow, value: string): boolean =>
    !value || value === ALL_FILTER_VALUE || valueOf(actor) === value;

export const actorMatchFunctions: MatchFunctions<ActorRow, ActorFilterValues> = {
  [ACTOR_FILTER_NAMES.ATESPACE]: exactMatch((actor) => actor.atespace),
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: exactMatch((actor) => ACTOR_STATE_GROUP[actor.state]),
  [ACTOR_FILTER_NAMES.CODEBASE]: exactMatch((actor) => actor.agent?.codebase?.name),
};
