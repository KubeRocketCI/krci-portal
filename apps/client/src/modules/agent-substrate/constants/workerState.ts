import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { WorkerState } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

export const WORKER_STATE_ICON: Record<WorkerState, K8sResourceStatusIcon> = {
  active: { component: CircleCheck, color: STATUS_COLOR.SUCCESS },
  draining: { component: LoaderCircle, color: STATUS_COLOR.MISSING, isSpinning: true },
  unavailable: { component: CircleX, color: STATUS_COLOR.ERROR },
  unknown: { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN },
};
