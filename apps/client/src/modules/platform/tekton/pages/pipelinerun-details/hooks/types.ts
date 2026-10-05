import { ApprovalTask, CustomRun, PipelineTask, Task, TaskRun } from "@my-project/shared";

export type TaskSpec = Task["spec"];

/** A namespaced Task, addressed for a single GET. */
export type NamespacedTaskRef = { namespace: string; name: string };

export type PipelineRunTaskData = {
  pipelineRunTask: PipelineTask;
  /** The spec the TaskRun ran with, else the inline spec of the pipeline task. */
  taskSpec: TaskSpec | undefined;
  /** Set only for a live pipeline task with no run and no spec that refers to a namespaced Task. */
  pendingTaskRef: NamespacedTaskRef | undefined;
  taskRun: TaskRun | undefined;
  approvalTask: ApprovalTask | undefined;
  /** The run that represents the task: its TaskRun, else its CustomRun. */
  run: TaskRun | CustomRun | undefined;
};
