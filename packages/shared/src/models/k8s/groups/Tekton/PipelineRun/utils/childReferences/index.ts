import type { PipelineRun } from "../../types.js";

export type PipelineRunChildReference = NonNullable<NonNullable<PipelineRun["status"]>["childReferences"]>[number];

/**
 * A child reference points at a TaskRun unless its kind is "Run" — those are
 * v1alpha1 CustomRun children, which are not TaskRuns and never appear in a
 * TaskRun list. Every reader of status.childReferences must apply this filter,
 * or a CustomRun name can be paired with an unrelated TaskRun of the same name.
 */
export const isTaskRunChildReference = (childReference: PipelineRunChildReference): boolean =>
  childReference.kind !== "Run";

/**
 * The authoritative pipeline task -> TaskRun link. TaskRun names cannot be derived
 * from the pipeline task name, since Tekton truncates and hashes long names.
 */
export const buildTaskRunNameByPipelineTaskMap = (
  childReferences?: PipelineRunChildReference[]
): Map<string, string> => {
  const map = new Map<string, string>();

  for (const childReference of childReferences ?? []) {
    if (!isTaskRunChildReference(childReference)) continue;
    if (childReference.pipelineTaskName && childReference.name) {
      map.set(childReference.pipelineTaskName, childReference.name);
    }
  }

  return map;
};
