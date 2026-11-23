import type { ActorState, ActorStateGroup, SnapshotDurableState } from "@my-project/shared";
import type { BadgeProps } from "@/core/components/ui/badge";

export const ACTOR_STATE_GROUP_LABEL: Record<ActorStateGroup, string> = {
  running: "Running",
  transitional: "Transitional",
  suspended: "Suspended",
  crashed: "Crashed",
  unknown: "Unknown",
};

export const ACTOR_STATE_VARIANT: Record<ActorState, NonNullable<BadgeProps["variant"]>> = {
  running: "success",
  suspended: "neutral",
  resuming: "info",
  suspending: "info",
  reverting: "warning",
  deleting: "warning",
  crashed: "error",
  transitional: "info",
  unknown: "neutral",
};

export const SNAPSHOT_DURABLE_STATE_VARIANT: Record<SnapshotDurableState, NonNullable<BadgeProps["variant"]>> = {
  completed: "success",
  pending: "warning",
  none: "neutral",
  unknown: "neutral",
};
