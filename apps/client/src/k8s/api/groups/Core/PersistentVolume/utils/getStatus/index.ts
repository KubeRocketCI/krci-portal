import { CircleCheck, CircleDot, CircleX, LoaderCircle, ShieldQuestion, TriangleAlert } from "lucide-react";
import type { PersistentVolume } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

const readPhase = (pv: PersistentVolume): string | undefined => (pv.status as { phase?: string } | undefined)?.phase;

export const getPVStatusIcon = (pv: PersistentVolume): K8sResourceStatusIcon => {
  if (pv.metadata?.deletionTimestamp) return { component: TriangleAlert, color: STATUS_COLOR.MISSING };

  const phase = readPhase(pv);
  switch (phase) {
    case "Bound":
      return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
    case "Available":
      return { component: CircleDot, color: STATUS_COLOR.IN_PROGRESS };
    case "Released":
      return { component: TriangleAlert, color: STATUS_COLOR.MISSING };
    case "Failed":
      return { component: CircleX, color: STATUS_COLOR.ERROR };
    case "Pending":
      return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
    default:
      return { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN };
  }
};

export const getPVStatusLabel = (pv: PersistentVolume): string => {
  if (pv.metadata?.deletionTimestamp) return "Terminating";

  const phase = readPhase(pv);
  switch (phase) {
    case "Bound":
      return "Bound";
    case "Available":
      return "Available";
    case "Released":
      return "Released";
    case "Failed":
      return "Failed";
    case "Pending":
      return "Pending";
    default:
      return "Unknown";
  }
};
