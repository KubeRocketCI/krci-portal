import type { ACTOR_FILTER_NAMES } from "../../../../../constants/actorFilter";

export type ActorFilterValues = {
  [ACTOR_FILTER_NAMES.ATESPACE]: string;
  /** `ActorStateGroup`, not `ActorState`. */
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: string;
  [ACTOR_FILTER_NAMES.CODEBASE]: string;
  [ACTOR_FILTER_NAMES.AGENT_PROFILE]: string;
  /** `workerPoolText` of the worker pool. */
  [ACTOR_FILTER_NAMES.WORKER_POOL]: string;
};
