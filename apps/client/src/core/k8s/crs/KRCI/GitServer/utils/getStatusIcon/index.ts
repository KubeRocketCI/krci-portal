import { STATUS_COLOR } from "@/core/k8s/constants/colors";
import { StatusIcon } from "@/core/k8s/types";
import { CircleCheck, CircleX } from "lucide-react";

export const getStatusIcon = (connected: boolean | undefined): StatusIcon => {
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
