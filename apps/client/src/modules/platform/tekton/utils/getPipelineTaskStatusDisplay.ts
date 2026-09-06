import { getApprovalTaskStatusDisplay } from "@/k8s/api/groups/KRCI/ApprovalTask";
import { getTaskRunStatusDisplay } from "@/k8s/api/groups/Tekton/TaskRun";
import { K8sResourceStatusDisplay } from "@/k8s/types";
import { ApprovalTask, ClassifiableRun } from "@my-project/shared";

/** One status per pipeline task. With an ApprovalTask: the approval rule. Without: the run. */
export const getPipelineTaskStatusDisplay = (task: {
  approvalTask?: ApprovalTask;
  run?: ClassifiableRun;
}): K8sResourceStatusDisplay =>
  task.approvalTask ? getApprovalTaskStatusDisplay(task.approvalTask, task.run) : getTaskRunStatusDisplay(task.run);
