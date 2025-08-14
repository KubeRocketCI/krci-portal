import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import {
  getTaskRunStepStatus,
  TaskRunStepState,
  taskRunStepStatusFieldName,
  taskRunStepStatusReason,
} from "@my-project/shared";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion, SquareDashedIcon } from "lucide-react";

export const getStepStatusIcon = (step: TaskRunStepState): K8sResourceStatusIcon => {
  const status = getTaskRunStepStatus(step);

  if (status.status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  switch (status.status) {
    case taskRunStepStatusFieldName.running:
      return {
        component: LoaderCircle,
        color: STATUS_COLOR.IN_PROGRESS,
        isSpinning: true,
      };
    case taskRunStepStatusFieldName.waiting:
      return {
        component: SquareDashedIcon,
        color: STATUS_COLOR.UNKNOWN,
      };
    case taskRunStepStatusFieldName.terminated:
      if (status.reason === taskRunStepStatusReason.Completed) {
        return {
          component: CircleCheck,
          color: STATUS_COLOR.SUCCESS,
        };
      }

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
