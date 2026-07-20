import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import {
  getPipelineRunStatus,
  isPipelineRunCancelledReason,
  PipelineRun,
  pipelineRunReason,
  pipelineRunStatus,
} from "@my-project/shared";
import { CircleCheck, CircleSlash, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";

export const getStatusIcon = (pipelineRun: PipelineRun | undefined): K8sResourceStatusIcon => {
  const { status, reason } = getPipelineRunStatus(pipelineRun);

  // A cancelled/stopped run is reported by Tekton with condition status "False",
  // but it is not a failure — render it neutrally (grey) rather than as an error.
  if (isPipelineRunCancelledReason(reason)) {
    return {
      component: CircleSlash,
      color: STATUS_COLOR.CANCELLED,
    };
  }

  switch (status) {
    case pipelineRunStatus.unknown:
      if (reason === pipelineRunReason.started) {
        return {
          component: LoaderCircle,
          color: STATUS_COLOR.IN_PROGRESS,
          isSpinning: true,
        };
      }

      if (reason === pipelineRunReason.running) {
        return {
          component: LoaderCircle,
          color: STATUS_COLOR.IN_PROGRESS,
          isSpinning: true,
        };
      }

      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };
    case pipelineRunStatus.true:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };
    case pipelineRunStatus.false:
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
