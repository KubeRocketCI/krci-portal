import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { Application, applicationHealthStatus, getApplicationStatus } from "@my-project/shared";
import { CirclePause, Ghost, Heart, HeartCrack, LoaderCircle, ShieldQuestion } from "lucide-react";

export const getStatusIcon = (application: Application): K8sResourceStatusIcon => {
  const { status } = getApplicationStatus(application);

  if (status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  switch (status) {
    case applicationHealthStatus.healthy:
      return {
        component: Heart,
        color: STATUS_COLOR.SUCCESS,
      };

    case applicationHealthStatus.progressing:
      return {
        component: LoaderCircle,
        color: STATUS_COLOR.IN_PROGRESS,
        isSpinning: true,
      };

    case applicationHealthStatus.degraded:
      return {
        component: HeartCrack,
        color: STATUS_COLOR.ERROR,
      };

    case applicationHealthStatus.suspended:
      return {
        component: CirclePause,
        color: STATUS_COLOR.SUSPENDED,
      };

    case applicationHealthStatus.missing:
      return {
        component: Ghost,
        color: STATUS_COLOR.MISSING,
      };

    default:
      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };
  }
};
