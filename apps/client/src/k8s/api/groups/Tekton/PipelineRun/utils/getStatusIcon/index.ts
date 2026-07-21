import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import {
  getPipelineRunStatus,
  isPipelineRunCancelledReason,
  isPipelineRunInProgress,
  PipelineRun,
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

  // A reasonless "Unknown" (loading, or an archived unfinalized record) is not in
  // progress and falls through to the neutral icon below. See isPipelineRunInProgress.
  if (isPipelineRunInProgress(pipelineRun)) {
    return {
      component: LoaderCircle,
      color: STATUS_COLOR.IN_PROGRESS,
      isSpinning: true,
    };
  }

  switch (status) {
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
