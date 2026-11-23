import type { ActorState, ActorStateGroup } from "./types.js";

export const ACTOR_STATE_GROUP: Record<ActorState, ActorStateGroup> = {
  running: "running",
  suspended: "suspended",
  crashed: "crashed",
  unknown: "unknown",
  resuming: "transitional",
  suspending: "transitional",
  deleting: "transitional",
  reverting: "transitional",
  transitional: "transitional",
};
