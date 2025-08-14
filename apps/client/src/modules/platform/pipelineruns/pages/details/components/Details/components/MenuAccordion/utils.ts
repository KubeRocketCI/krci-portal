import { getApprovalTaskStatusIcon } from "@/k8s/api/groups/KRCI/ApprovalTask";
import { getTaskRunStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { K8sResourceStatusIcon } from "@/k8s/types";
import { TaskRunStepState, ApprovalTask, TaskRun, getTaskRunStatus } from "@my-project/shared";
import { ShieldQuestion } from "lucide-react";

export const approvalTaskBackground =
  "repeating-linear-gradient(45deg, rgba(96, 96, 96, 0.15), rgba(96, 96, 96, 0.15) 10px, rgba(70, 70, 70, 0.15) 10px, rgba(70, 70, 70, 0.15) 20px);";

export function updateUnexecutedSteps(steps: TaskRunStepState[] | undefined) {
  if (!steps) {
    return [];
  }

  let errorIndex = steps.length - 1;
  return steps.map((step, index) => {
    if (!step.terminated || step.terminated.reason !== "Completed") {
      errorIndex = Math.min(index, errorIndex);
    }
    if (index > errorIndex) {
      delete step.running;
      delete step.terminated;
      return step;
    }
    return step;
  });
}

export const getApprovalTaskOrTaskRunStatusIcon = (
  approvalTask: ApprovalTask | undefined,
  taskRun: TaskRun | undefined
): K8sResourceStatusIcon => {
  if (approvalTask) {
    return getApprovalTaskStatusIcon(approvalTask);
  }

  if (taskRun) {
    return getTaskRunStatusIcon(taskRun);
  }

  return {
    component: ShieldQuestion,
    color: STATUS_COLOR.UNKNOWN,
  };
};

export const getApprovalTaskOrTaskRunStatusTitle = (
  approvalTask: ApprovalTask | undefined,
  taskRun: TaskRun | undefined
) => {
  if (approvalTask) {
    return `Status: ${approvalTask?.spec?.action}`;
  }

  const taskRunStatus = getTaskRunStatus(taskRun);

  return `Status: ${taskRunStatus.status}. Reason: ${taskRunStatus.reason}`;
};
