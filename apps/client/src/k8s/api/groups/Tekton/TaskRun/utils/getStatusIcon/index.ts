import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { getTaskRunStatus, TaskRun, taskRunStatus, taskRunStatusReason } from "@my-project/shared";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";

export const getStatusIcon = (resource: TaskRun): K8sResourceStatusIcon => {
  const status = getTaskRunStatus(resource);

  if (status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  switch (status.status) {
    case taskRunStatus.unknown:
      if (
        status.reason === taskRunStatusReason.started ||
        status.reason === taskRunStatusReason.pending ||
        status.reason === taskRunStatusReason.running
      ) {
        return {
          component: LoaderCircle,
          color: STATUS_COLOR.IN_PROGRESS,
          isSpinning: true,
        };
      }

      if (status.reason === taskRunStatusReason.TaskRunCancelled.toLowerCase()) {
        return {
          component: CircleX,
          color: STATUS_COLOR.SUSPENDED,
        };
      }

      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };

    case taskRunStatus.true:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };

    case taskRunStatus.false:
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
