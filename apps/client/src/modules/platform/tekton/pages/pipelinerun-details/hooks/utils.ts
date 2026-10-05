import {
  ApprovalTask,
  approvalTaskLabels,
  CustomRun,
  customRunLabels,
  buildTaskRunNameByPipelineTaskMap,
  PipelineRunChildReference,
  PipelineTask,
  TaskRun,
  taskRunLabels,
} from "@my-project/shared";
import type { PipelineRunTaskData, TaskSpec } from "./types";

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

/**
 * Returns the Task name only for a ref to a namespaced Task.
 * Resolver, bundle, ClusterTask and custom task (`apiVersion`) refs return undefined.
 */
export const getNamespacedTaskRefName = (taskRef: PipelineTask["taskRef"]): string | undefined => {
  if (!taskRef?.name || taskRef.resolver || taskRef.bundle || taskRef.apiVersion) return undefined;
  if (taskRef.kind && taskRef.kind !== "Task") return undefined;

  return taskRef.name;
};

/** The Task a pipeline task runs: its ref name, else the pipeline task name (inline spec, resolver). */
export const getTaskName = (pipelineTask: PipelineTask | undefined): string =>
  pipelineTask?.taskRef?.name || pipelineTask?.name || "";

/** The TaskRun exists and is not finished, but Tekton has not written its spec snapshot yet. */
export const isAwaitingTaskSpec = (data: Partial<Pick<PipelineRunTaskData, "taskRun" | "taskSpec">>): boolean =>
  !!data.taskRun && !data.taskSpec && !data.taskRun.status?.completionTime;

/** Steps exist, or a spec that holds them can still arrive. */
export const canHaveSteps = (
  data: Partial<Pick<PipelineRunTaskData, "taskRun" | "taskSpec" | "pendingTaskRef">>
): boolean =>
  !!data.taskRun?.status?.steps?.length ||
  !!data.taskSpec?.steps?.length ||
  !!data.pendingTaskRef ||
  isAwaitingTaskSpec(data);

export const buildPipelineRunTasksByNameMap = (params: {
  allPipelineTasks: PipelineTask[];
  taskRuns: TaskRun[];
  approvalTasks: ApprovalTask[];
  customRuns?: CustomRun[];
  childReferences?: PipelineRunChildReference[];
  /** Namespace of a live PipelineRun. Without it, no task gets a `pendingTaskRef`. */
  liveNamespace?: string;
}): Map<string, PipelineRunTaskData> => {
  const { allPipelineTasks, taskRuns, approvalTasks, customRuns = [], childReferences, liveNamespace } = params;

  const approvalTaskByPipelineTask = indexByKey(
    approvalTasks,
    (approvalTask) => approvalTask.metadata?.labels?.[approvalTaskLabels.pipelineTask]
  );
  const customRunByPipelineTask = indexByKey(
    customRuns,
    (customRun) => customRun.metadata?.labels?.[customRunLabels.pipelineTask]
  );
  const taskRunIndex = buildTaskRunIndex(taskRuns, childReferences);

  const result = new Map<string, PipelineRunTaskData>();

  for (const pipelineTask of allPipelineTasks) {
    if (!pipelineTask.name) continue;

    const taskRun = findTaskRunForPipelineTask(taskRunIndex, pipelineTask.name);
    const run = taskRun ?? customRunByPipelineTask.get(pipelineTask.name);
    const taskSpec: TaskSpec | undefined = taskRun?.status?.taskSpec ?? pipelineTask.taskSpec;
    const pendingTaskName = !run && !taskSpec ? getNamespacedTaskRefName(pipelineTask.taskRef) : undefined;

    result.set(pipelineTask.name, {
      pipelineRunTask: pipelineTask,
      taskSpec,
      pendingTaskRef:
        liveNamespace && pendingTaskName ? { namespace: liveNamespace, name: pendingTaskName } : undefined,
      taskRun,
      approvalTask: approvalTaskByPipelineTask.get(pipelineTask.name),
      run,
    });
  }

  return result;
};
