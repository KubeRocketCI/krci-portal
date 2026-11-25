import type { ACTOR_FILTER_NAMES } from "../../../../../constants/actorFilter";

export type ActorFilterValues = {
  [ACTOR_FILTER_NAMES.ATESPACE]: string;
  /** `ActorStateGroup`, not `ActorState`. */
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: string;
  /** `workerPoolText` of the worker pool. */
  [ACTOR_FILTER_NAMES.WORKER_POOL]: string;
};
