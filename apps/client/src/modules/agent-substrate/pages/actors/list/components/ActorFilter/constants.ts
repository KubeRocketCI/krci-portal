import type { ActorRow } from "@my-project/shared";
import type { MatchFunctions } from "@/core/providers/Filter";
import { ACTOR_FILTER_NAMES } from "../../../../../constants/actorFilter";
import {
  ALL_FILTER_VALUE,
  actorStateMatch,
  agentProfileMatch,
  codebaseMatch,
  exactMatch,
} from "../../../../../utils/fleetFilter";
import { placementWorkerPool } from "../../../../../utils/roomLabel";
import type { ActorFilterValues } from "./types";

export const actorFilterDefaultValues: ActorFilterValues = {
  [ACTOR_FILTER_NAMES.ATESPACE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.CODEBASE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.AGENT_PROFILE]: ALL_FILTER_VALUE,
  [ACTOR_FILTER_NAMES.WORKER_POOL]: ALL_FILTER_VALUE,
};

export const actorMatchFunctions: MatchFunctions<ActorRow, ActorFilterValues> = {
  [ACTOR_FILTER_NAMES.ATESPACE]: exactMatch((actor) => actor.atespace),
  [ACTOR_FILTER_NAMES.ACTOR_STATE]: actorStateMatch,
  [ACTOR_FILTER_NAMES.CODEBASE]: codebaseMatch,
  [ACTOR_FILTER_NAMES.AGENT_PROFILE]: agentProfileMatch,
  [ACTOR_FILTER_NAMES.WORKER_POOL]: exactMatch((actor) => placementWorkerPool(actor.placement)),
};
