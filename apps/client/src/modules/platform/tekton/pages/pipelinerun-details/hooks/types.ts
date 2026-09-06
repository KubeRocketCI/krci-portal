import { ApprovalTask, CustomRun, PipelineTask, Task, TaskRun } from "@my-project/shared";

export type PipelineRunTaskData = {
  pipelineRunTask: PipelineTask;
  task: Task | undefined;
  taskRun: TaskRun | undefined;
  approvalTask: ApprovalTask | undefined;
  /** The run that represents the task: its TaskRun, else its CustomRun. */
  run: TaskRun | CustomRun | undefined;
};
