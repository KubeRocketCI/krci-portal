import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { pipelineRunPhase, PipelineRunPhase } from "@my-project/shared";
import { CircleCheck, CircleSlash, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";

/**
 * Icon per PipelineRun phase. Switches on `phase` only; the switch is
 * exhaustive so a new phase value fails tsc here.
 */
export const getPhaseIcon = (phase: PipelineRunPhase): K8sResourceStatusIcon => {
  switch (phase) {
    case pipelineRunPhase["in-progress"]:
      return {
        component: LoaderCircle,
        color: STATUS_COLOR.IN_PROGRESS,
        isSpinning: true,
      };
    case pipelineRunPhase.cancelling:
      return {
        component: CircleSlash,
        color: STATUS_COLOR.CANCELLED,
        isSpinning: true,
      };
    case pipelineRunPhase.cancelled:
      return {
        component: CircleSlash,
        color: STATUS_COLOR.CANCELLED,
      };
    case pipelineRunPhase.succeeded:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };
    case pipelineRunPhase.failed:
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };
    case pipelineRunPhase.unknown:
      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };
    default: {
      const _exhaustiveCheck: never = phase;
      throw new Error(`Unhandled PipelineRun phase: ${_exhaustiveCheck as PipelineRunPhase}`);
    }
  }
};
