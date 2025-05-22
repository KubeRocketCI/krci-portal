import { Codebase } from "@my-project/shared";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import { k8sCodebaseStatus } from "../..";
import { STATUS_COLOR } from "@/core/k8s/constants/colors";
import { StatusIcon } from "@/core/k8s/types";

export const getStatusIcon = (resource: Codebase): StatusIcon => {
  const status = resource.status?.status;

  if (status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  const _status = status.toLowerCase();

  switch (_status) {
    case k8sCodebaseStatus.CREATED:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };

    case k8sCodebaseStatus.FAILED:
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };

    case k8sCodebaseStatus.INITIALIZED:
    case k8sCodebaseStatus.IN_PROGRESS:
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
