import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { taskRunPhase, TaskRunPhase } from "@my-project/shared";
import { CircleCheck, CircleSlash, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";

/** Icon per phase. Exhaustive switch; a new phase fails tsc here. */
export const getPhaseIcon = (phase: TaskRunPhase): K8sResourceStatusIcon => {
  switch (phase) {
    case taskRunPhase["in-progress"]:
      return {
        component: LoaderCircle,
        color: STATUS_COLOR.IN_PROGRESS,
        isSpinning: true,
      };
    case taskRunPhase.cancelled:
      return {
        component: CircleSlash,
        color: STATUS_COLOR.CANCELLED,
      };
    case taskRunPhase.succeeded:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };
    case taskRunPhase.failed:
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };
    case taskRunPhase.unknown:
      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
      };
    default: {
      const _exhaustiveCheck: never = phase;
      throw new Error(`Unhandled TaskRun phase: ${_exhaustiveCheck as TaskRunPhase}`);
    }
  }
};
