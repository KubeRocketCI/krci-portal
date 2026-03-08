import type { PipelineTask, Task, TaskRun } from "@my-project/shared";

/**
 * Returns the task description from the Task resource, from the
 * TaskRun's embedded taskSpec (populated by the Tekton controller),
 * or from the PipelineTask definition in the pipeline spec.
 * Falls back to empty string when no source has a description.
 */
export function getTaskDescription(task?: Task, taskRun?: TaskRun, pipelineTask?: PipelineTask): string {
  return task?.spec?.description || taskRun?.status?.taskSpec?.description || pipelineTask?.description || "";
}
