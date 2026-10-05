import type { PipelineTask, Task } from "@my-project/shared";

/**
 * Returns the description of the task spec, else of the pipeline task, else an empty string.
 */
export function getTaskDescription(taskSpec?: Task["spec"], pipelineTask?: PipelineTask): string {
  return taskSpec?.description || pipelineTask?.description || "";
}
