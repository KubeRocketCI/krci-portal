import { ApprovalTask, approvalTaskLabels, PipelineTask, Task, TaskRun, taskRunLabels } from "@my-project/shared";
import type { PipelineRunTaskData } from "./types";

export const findTaskForPipelineTask = (tasks: Task[], pipelineTask: PipelineTask): Task | undefined => {
  return tasks.find((task) => task.metadata?.name === pipelineTask?.taskRef?.name);
};

export const findTaskRunForPipelineTask = (
  taskRuns: TaskRun[],
  pipelineTask: PipelineTask,
  pipelineRunName?: string
): TaskRun | undefined => {
  const byLabel = taskRuns.find(
    (taskRun) => taskRun.metadata?.labels?.[taskRunLabels.pipelineTask] === pipelineTask?.name
  );
  if (byLabel) return byLabel;
  if (!pipelineRunName || !pipelineTask?.name) return undefined;
  const prefix = `${pipelineRunName}-${pipelineTask.name}-`;
  return taskRuns.find((taskRun) => {
    const n = taskRun.metadata?.name;
    return typeof n === "string" && n.startsWith(prefix);
  });
};

export const findApprovalTaskForPipelineTask = (
  approvalTasks: ApprovalTask[],
  pipelineTask: PipelineTask
): ApprovalTask | undefined => {
  return approvalTasks.find(
    (approvalTask) => approvalTask.metadata?.labels?.[approvalTaskLabels.pipelineTask] === pipelineTask?.name
  );
};

export const buildPipelineRunTasksByNameMap = (params: {
  allPipelineTasks: PipelineTask[];
  tasks?: Task[];
  taskRuns: TaskRun[];
  approvalTasks: ApprovalTask[];
  pipelineRunName?: string;
}): Map<string, PipelineRunTaskData> => {
  const { allPipelineTasks, tasks = [], taskRuns, approvalTasks, pipelineRunName } = params;
  return allPipelineTasks.reduce((acc, pipelineTask) => {
    if (!pipelineTask.name) return acc;
    acc.set(pipelineTask.name, {
      pipelineRunTask: pipelineTask,
      task: findTaskForPipelineTask(tasks, pipelineTask),
      taskRun: findTaskRunForPipelineTask(taskRuns, pipelineTask, pipelineRunName),
      approvalTask: findApprovalTaskForPipelineTask(approvalTasks, pipelineTask),
    });
    return acc;
  }, new Map<string, PipelineRunTaskData>());
};
