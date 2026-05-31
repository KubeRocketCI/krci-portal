import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion, TriangleAlert } from "lucide-react";
import type { PersistentVolumeClaim } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

const readPhase = (pvc: PersistentVolumeClaim): string | undefined =>
  (pvc.status as { phase?: string } | undefined)?.phase;

export const getPVCStatusIcon = (pvc: PersistentVolumeClaim): K8sResourceStatusIcon => {
  if (pvc.metadata?.deletionTimestamp) return { component: TriangleAlert, color: STATUS_COLOR.MISSING };

  const phase = readPhase(pvc);
  switch (phase) {
    case "Bound":
      return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
    case "Pending":
      return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
    case "Lost":
      return { component: CircleX, color: STATUS_COLOR.ERROR };
    default:
      return { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN };
  }
};

export const getPVCStatusLabel = (pvc: PersistentVolumeClaim): string => {
  if (pvc.metadata?.deletionTimestamp) return "Terminating";

  const phase = readPhase(pvc);
  switch (phase) {
    case "Bound":
      return "Bound";
    case "Pending":
      return "Pending";
    case "Lost":
      return "Lost";
    default:
      return "Unknown";
  }
};
