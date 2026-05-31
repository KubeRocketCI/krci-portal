import { CircleCheck, LoaderCircle, ShieldQuestion, TriangleAlert } from "lucide-react";
import type { DaemonSet } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

interface DaemonSetStatusView {
  desired: number;
  ready: number;
  available: number;
  terminating: boolean;
}

const readStatus = (daemonSet: DaemonSet): DaemonSetStatusView => {
  const status = daemonSet.status;
  return {
    desired: status?.desiredNumberScheduled ?? 0,
    ready: status?.numberReady ?? 0,
    available: status?.numberAvailable ?? 0,
    terminating: !!daemonSet.metadata?.deletionTimestamp,
  };
};

export const getDaemonSetStatusIcon = (daemonSet: DaemonSet): K8sResourceStatusIcon => {
  const s = readStatus(daemonSet);
  if (s.terminating) return { component: TriangleAlert, color: STATUS_COLOR.MISSING };
  if (s.desired === 0) return { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN };
  if (s.ready === s.desired && s.available === s.desired) {
    return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
  }
  return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
};

export const getDaemonSetStatusLabel = (daemonSet: DaemonSet): string => {
  const s = readStatus(daemonSet);
  if (s.terminating) return "Terminating";
  if (s.desired === 0) return "Not Scheduled";
  if (s.ready === s.desired && s.available === s.desired) return "Available";
  return "Progressing";
};
