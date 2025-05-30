import { STATUS_COLOR } from "@/core/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/core/k8s/types";
import { CircleCheck, CircleX } from "lucide-react";

export const getStatusIcon = (connected: boolean | undefined): K8sResourceStatusIcon => {
  if (connected === undefined) {
    return {
      component: CircleX,
      color: STATUS_COLOR.ERROR,
    };
  }

  if (connected) {
    return {
      component: CircleCheck,
      color: STATUS_COLOR.SUCCESS,
    };
  }
  return {
    component: CircleX,
    color: STATUS_COLOR.ERROR,
  };
};
