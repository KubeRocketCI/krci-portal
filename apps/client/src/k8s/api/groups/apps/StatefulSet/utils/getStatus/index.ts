import { CircleCheck, LoaderCircle, Pause, TriangleAlert } from "lucide-react";
import type { StatefulSet } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

interface StatefulSetStatusView {
  desired: number;
  ready: number;
  updated: number;
  available: number;
  terminating: boolean;
}

const readStatus = (statefulSet: StatefulSet): StatefulSetStatusView => {
  const spec = statefulSet.spec;
  const status = statefulSet.status;
  return {
    desired: spec?.replicas ?? 0,
    ready: status?.readyReplicas ?? 0,
    updated: status?.updatedReplicas ?? 0,
    available: status?.availableReplicas ?? 0,
    terminating: !!statefulSet.metadata?.deletionTimestamp,
  };
};

export const getStatefulSetStatusIcon = (statefulSet: StatefulSet): K8sResourceStatusIcon => {
  const s = readStatus(statefulSet);
  if (s.terminating) return { component: TriangleAlert, color: STATUS_COLOR.MISSING };
  if (s.desired === 0) return { component: Pause, color: STATUS_COLOR.SUSPENDED };
  if (s.ready === s.desired && s.updated === s.desired && s.available === s.desired) {
    return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
  }
  return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
};

export const getStatefulSetStatusLabel = (statefulSet: StatefulSet): string => {
  const s = readStatus(statefulSet);
  if (s.terminating) return "Terminating";
  if (s.desired === 0) return "Scaled Down";
  if (s.ready === s.desired && s.updated === s.desired && s.available === s.desired) return "Available";
  return "Progressing";
};
