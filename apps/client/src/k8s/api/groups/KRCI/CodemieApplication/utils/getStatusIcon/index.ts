import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { codemieApplicationStatus, CodemieApplication } from "@my-project/shared";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";

export const getCodemieApplicationStatusIcon = (
  codemieApplication: CodemieApplication | undefined
): K8sResourceStatusIcon => {
  const status = codemieApplication?.status?.value;

  if (!status) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  const _status = status.toLowerCase();

  switch (_status) {
    case codemieApplicationStatus.created:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };

    case codemieApplicationStatus.error:
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };

    default:
      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };
  }
};
