import type { ACTOR_FILTER_NAMES } from "../../../../../constants/actorFilter";

export type ActorFilterValues = {
  [ACTOR_FILTER_NAMES.ATESPACE]: string;
  /** `ActorStateGroup`, not `ActorState`. */
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: string;
  [ACTOR_FILTER_NAMES.CODEBASE]: string;
};
