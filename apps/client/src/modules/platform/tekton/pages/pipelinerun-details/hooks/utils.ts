import {
  ApprovalTask,
  approvalTaskLabels,
  buildTaskRunNameByPipelineTaskMap,
  PipelineRunChildReference,
  PipelineTask,
  Task,
  TaskRun,
  taskRunLabels,
} from "@my-project/shared";
import type { PipelineRunTaskData } from "./types";

/** Keeps the first item per key, so lookups resolve as the equivalent Array.prototype.find would have. */
const indexByKey = <T>(items: T[], keyOf: (item: T) => string | undefined): Map<string, T> => {
  const map = new Map<string, T>();

  for (const item of items) {
    const key = keyOf(item);
    if (key && !map.has(key)) {
      map.set(key, item);
    }
  }

  return map;
};

export interface TaskRunIndex {
  byPipelineTask: Map<string, TaskRun>;
  byName: Map<string, TaskRun>;
  nameByPipelineTask: Map<string, string>;
}

export const buildTaskRunIndex = (
  taskRuns: TaskRun[],
  childReferences?: PipelineRunChildReference[]
): TaskRunIndex => ({
  byPipelineTask: indexByKey(taskRuns, (taskRun) => taskRun.metadata?.labels?.[taskRunLabels.pipelineTask]),
  byName: indexByKey(taskRuns, (taskRun) => taskRun.metadata?.name),
  nameByPipelineTask: buildTaskRunNameByPipelineTaskMap(childReferences),
});

export const findTaskRunForPipelineTask = (index: TaskRunIndex, pipelineTaskName?: string): TaskRun | undefined => {
  if (!pipelineTaskName) return undefined;

  const byLabel = index.byPipelineTask.get(pipelineTaskName);
  if (byLabel) return byLabel;

  // Defense in depth: Tekton always sets this label on TaskRuns it creates, so this
  // tier should rarely fire. Kept in case a TaskRun is observed before its label is set,
  // or via a future Tekton Results/API path that doesn't preserve labels.
  const taskRunName = index.nameByPipelineTask.get(pipelineTaskName);
  return taskRunName ? index.byName.get(taskRunName) : undefined;
};

export const buildPipelineRunTasksByNameMap = (params: {
  allPipelineTasks: PipelineTask[];
  tasks?: Task[];
  taskRuns: TaskRun[];
  approvalTasks: ApprovalTask[];
  childReferences?: PipelineRunChildReference[];
}): Map<string, PipelineRunTaskData> => {
  const { allPipelineTasks, tasks = [], taskRuns, approvalTasks, childReferences } = params;

  // `tasks` is the namespace-wide Task list, so scanning it per pipeline task was the dominant cost.
  const taskByName = indexByKey(tasks, (task) => task.metadata?.name);
  const approvalTaskByPipelineTask = indexByKey(
    approvalTasks,
    (approvalTask) => approvalTask.metadata?.labels?.[approvalTaskLabels.pipelineTask]
  );
  const taskRunIndex = buildTaskRunIndex(taskRuns, childReferences);

  const result = new Map<string, PipelineRunTaskData>();

  for (const pipelineTask of allPipelineTasks) {
    if (!pipelineTask.name) continue;

    const taskRefName = pipelineTask.taskRef?.name;

    result.set(pipelineTask.name, {
      pipelineRunTask: pipelineTask,
      task: taskRefName ? taskByName.get(taskRefName) : undefined,
      taskRun: findTaskRunForPipelineTask(taskRunIndex, pipelineTask.name),
      approvalTask: approvalTaskByPipelineTask.get(pipelineTask.name),
    });
  }

  return result;
};
