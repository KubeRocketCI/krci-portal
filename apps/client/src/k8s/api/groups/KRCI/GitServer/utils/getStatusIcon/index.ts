import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { GitServer } from "@my-project/shared";
import { CircleCheck, CircleX } from "lucide-react";

export const getStatusIcon = (gitServer: GitServer): K8sResourceStatusIcon => {
  const status = gitServer.status?.connected;

  if (status === undefined) {
    return {
      component: CircleX,
      color: STATUS_COLOR.ERROR,
    };
  }

  if (status) {
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
