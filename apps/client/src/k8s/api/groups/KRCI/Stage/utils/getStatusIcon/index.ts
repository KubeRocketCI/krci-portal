import { Stage, stageStatus } from "@my-project/shared";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";

export const getStatusIcon = (resource: Stage): K8sResourceStatusIcon => {
  const status = resource.status?.status;

  if (status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  const _status = status.toLowerCase();

  switch (_status) {
    case stageStatus.created:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };

    case stageStatus.failed:
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };

    case stageStatus.initialized:
    case stageStatus.in_progress:
      return {
        component: LoaderCircle,
        color: STATUS_COLOR.IN_PROGRESS,
        isSpinning: true,
      };

    default:
      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };
  }
};
