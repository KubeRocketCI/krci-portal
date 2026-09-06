import { ClassifiableRun, getTaskRunStatus, taskRunPhase } from "@my-project/shared";

/** Counts by phase. A pipeline task with no run object does not count. */
export function countSucceededTaskRuns(tasksByName: ReadonlyMap<string, { run?: ClassifiableRun }>): number {
  let completed = 0;

  tasksByName.forEach((data) => {
    if (getTaskRunStatus(data.run).phase === taskRunPhase.succeeded) {
      completed++;
    }
  });

  return completed;
}
