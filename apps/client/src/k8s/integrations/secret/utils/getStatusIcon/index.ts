import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { getIntegrationSecretStatus, Secret } from "@my-project/shared";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";

export const getIntegrationSecretStatusIcon = (integrationSecret: Secret): K8sResourceStatusIcon => {
  const status = getIntegrationSecretStatus(integrationSecret);

  if (status.connected === "true") {
    return {
      component: CircleCheck,
      color: STATUS_COLOR.SUCCESS,
    };
  }

  if (status.connected === "false") {
    return {
      component: CircleX,
      color: STATUS_COLOR.ERROR,
    };
  }

  return {
    component: ShieldQuestion,
    color: STATUS_COLOR.UNKNOWN,
  };
};
