import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { getJiraServerStatus, JiraServer, jiraServerStatus } from "@my-project/shared";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";

export const getJiraServerStatusIcon = (jiraServer: JiraServer | undefined): K8sResourceStatusIcon => {
  if (jiraServer === undefined) {
    return {
      component: ShieldQuestion,
      color: STATUS_COLOR.UNKNOWN,
    };
  }

  const { status } = getJiraServerStatus(jiraServer);

  if (status === jiraServerStatus.finished) {
    return {
      component: CircleCheck,
      color: STATUS_COLOR.SUCCESS,
    };
  }

  if (status === jiraServerStatus.error) {
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
