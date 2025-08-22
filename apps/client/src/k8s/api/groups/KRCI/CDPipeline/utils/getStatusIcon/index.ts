import { cdPipelineStatus, CDPipeline } from "@my-project/shared";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";

export const getStatusIcon = (resource: CDPipeline): K8sResourceStatusIcon => {
  const status = resource.status?.status;

  if (status === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  const _status = status.toLowerCase();

  switch (_status) {
    case cdPipelineStatus.created:
      return {
        component: CircleCheck,
        color: STATUS_COLOR.SUCCESS,
      };

    case cdPipelineStatus.failed:
      return {
        component: CircleX,
        color: STATUS_COLOR.ERROR,
      };

    case cdPipelineStatus.initialized:
    case cdPipelineStatus.in_progress:
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
