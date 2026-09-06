import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusDisplay } from "@/k8s/types";
import { ClassifiableRun, getTaskRunStatus, getTaskRunStatusLabel } from "@my-project/shared";
import { Circle } from "lucide-react";
import { getPhaseIcon } from "../getPhaseIcon";

/** Icon and label from one classification. `undefined` run: "Not Started". The only fallback site. */
export const getStatusDisplay = (run: ClassifiableRun | undefined): K8sResourceStatusDisplay => {
  if (run === undefined) {
    return {
      component: Circle,
      color: STATUS_COLOR.UNKNOWN,
      label: "Not Started",
    };
  }

  const status = getTaskRunStatus(run);

  return {
    ...getPhaseIcon(status.phase),
    label: getTaskRunStatusLabel(status),
  };
};
