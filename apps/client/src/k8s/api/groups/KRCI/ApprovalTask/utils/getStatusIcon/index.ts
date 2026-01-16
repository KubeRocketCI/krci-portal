import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { ApprovalTask } from "@my-project/shared";
import { CircleCheck, CircleSlash, CircleX, Clock, ShieldQuestion } from "lucide-react";

export const getStatusIcon = (resource: ApprovalTask): K8sResourceStatusIcon => {
  const status = resource.spec.action;

  if (status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  const _status = status.toLowerCase();

  switch (_status) {
    case "pending":
      return {
        component: Clock,
        color: STATUS_COLOR.IN_PROGRESS,
      };

    case "approved":
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };

    case "rejected":
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };

    case "canceled":
      return {
        component: CircleSlash,
        color: STATUS_COLOR.SUSPENDED,
        isSpinning: true,
      };

    default:
      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };
  }
};
