import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { getPipelineRunStatus, PipelineRun, pipelineRunReason, pipelineRunStatus } from "@my-project/shared";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";

export const getStatusIcon = (pipelineRun: PipelineRun | undefined): K8sResourceStatusIcon => {
  const { status, reason } = getPipelineRunStatus(pipelineRun);

  if (status === undefined || reason === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }
  const _status = status.toLowerCase();
  const _reason = reason.toLowerCase();

  switch (_status) {
    case pipelineRunStatus.unknown:
      if (_reason === pipelineRunReason.started) {
        return {
          component: LoaderCircle,
          color: STATUS_COLOR.IN_PROGRESS,
          isSpinning: true,
        };
      }

      if (_reason === pipelineRunReason.running) {
        return {
          component: LoaderCircle,
          color: STATUS_COLOR.IN_PROGRESS,
          isSpinning: true,
        };
      }

      if (_reason === pipelineRunReason.cancelled) {
        return {
          component: CircleX,
          color: STATUS_COLOR.SUSPENDED,
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
