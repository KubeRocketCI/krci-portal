import type { ActorStateGroup } from "@my-project/shared";

export const ACTOR_STATE_GROUP_LABEL: Record<ActorStateGroup, string> = {
  running: "Running",
  transitional: "Transitional",
  suspended: "Suspended",
  crashed: "Crashed",
  unknown: "Unknown",
};
