import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { Codemie } from "@my-project/shared";
import { CircleCheck, CircleX } from "lucide-react";

export const getCodemieStatusIcon = (codemie: Codemie | undefined): K8sResourceStatusIcon => {
  const status = codemie?.status?.connected;

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
