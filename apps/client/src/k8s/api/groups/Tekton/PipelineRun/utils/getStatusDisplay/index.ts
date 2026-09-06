import { K8sResourceStatusDisplay } from "@/k8s/types";
import { getPipelineRunStatusLabel, PipelineRunStatusResult } from "@my-project/shared";
import { getPhaseIcon } from "../getPhaseIcon";

/** Builds icon and label from one classification result so they cannot disagree. */
export const getStatusDisplay = (
  status: Pick<PipelineRunStatusResult, "phase" | "reason">
): K8sResourceStatusDisplay => {
  return {
    ...getPhaseIcon(status.phase),
    label: getPipelineRunStatusLabel(status),
  };
};
