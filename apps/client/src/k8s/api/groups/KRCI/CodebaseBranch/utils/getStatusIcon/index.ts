import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { CodebaseBranch, codebaseStatus } from "@my-project/shared";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";

export const getStatusIcon = (codebaseBranch: CodebaseBranch | undefined): K8sResourceStatusIcon => {
  const status = codebaseBranch?.status?.status;

  if (!status) {
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
