import { ApprovalTask, PipelineTask, Task, TaskRun } from "@my-project/shared";

export type PipelineRunTaskData = {
  pipelineRunTask: PipelineTask;
  task: Task | undefined;
  taskRun: TaskRun | undefined;
  approvalTask: ApprovalTask | undefined;
};
