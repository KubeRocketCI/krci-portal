import { getTaskRunPhaseIcon } from "@/k8s/api/groups/Tekton/TaskRun";
import { K8sResourceStatusDisplay } from "@/k8s/types";
import {
  ApprovalTask,
  ClassifiableRun,
  getTaskRunStatus,
  getTaskRunStatusLabel,
  taskRunPhase,
} from "@my-project/shared";
import { getStatusIcon } from "../getStatusIcon";

/**
 * A finished CustomRun is the truth; its reason carries the decision (Approved, Rejected) or the
 * failure (Timeout, Cancelled). Until it finishes, the ApprovalTask action is the state.
 */
export const getStatusDisplay = (
  approvalTask: ApprovalTask,
  run: ClassifiableRun | undefined
): K8sResourceStatusDisplay => {
  const status = getTaskRunStatus(run);

  if (run !== undefined && status.phase !== taskRunPhase["in-progress"]) {
    return { ...getTaskRunPhaseIcon(status.phase), label: getTaskRunStatusLabel(status) };
  }

  return { ...getStatusIcon(approvalTask), label: approvalTask.spec?.action || "Unknown" };
};
