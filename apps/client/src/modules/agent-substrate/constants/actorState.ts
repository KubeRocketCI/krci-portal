import { CircleCheck, CircleMinus, CirclePause, CirclePlay, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { ActorState, ActorStateGroup, SnapshotDurableState } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

export const ACTOR_STATE_GROUP_LABEL: Record<ActorStateGroup, string> = {
  running: "Running",
  transitional: "Transitional",
  suspended: "Suspended",
  crashed: "Crashed",
  unknown: "Unknown",
};

/** Colours and icons as on PipelineRuns: a state in transition spins. */
export const ACTOR_STATE_ICON: Record<ActorState, K8sResourceStatusIcon> = {
  running: { component: CirclePlay, color: STATUS_COLOR.SUCCESS },
  resuming: { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true },
  suspending: { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true },
  transitional: { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true },
  suspended: { component: CirclePause, color: STATUS_COLOR.SUSPENDED },
  reverting: { component: LoaderCircle, color: STATUS_COLOR.MISSING, isSpinning: true },
  deleting: { component: LoaderCircle, color: STATUS_COLOR.MISSING, isSpinning: true },
  crashed: { component: CircleX, color: STATUS_COLOR.ERROR },
  unknown: { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN },
};

export const SNAPSHOT_DURABLE_STATE_ICON: Record<SnapshotDurableState, K8sResourceStatusIcon> = {
  completed: { component: CircleCheck, color: STATUS_COLOR.SUCCESS },
  pending: { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true },
  none: { component: CircleMinus, color: STATUS_COLOR.UNKNOWN },
  unknown: { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN },
};
