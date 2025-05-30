import { Codebase, codebaseStatus } from "@my-project/shared";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import { STATUS_COLOR } from "@/core/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/core/k8s/types";

export const getStatusIcon = (resource: Codebase): K8sResourceStatusIcon => {
  const status = resource.status?.status;

  if (status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  const _status = status.toLowerCase();

  switch (_status) {
    case codebaseStatus.created:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };

    case codebaseStatus.failed:
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };

    case codebaseStatus.initialized:
    case codebaseStatus.in_progress:
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
