import type { PipelineTask } from "../../../Pipeline/types.js";
import type { PipelineRun } from "../../types.js";

export interface PipelineRunTaskGraphDefinitions {
  allTasks: PipelineTask[];
  mainTasks: PipelineTask[];
  finallyTasks: PipelineTask[];
}

/**
 * Resolves pipeline task definitions for the details sidebar and diagram.
 *
 * Order matches how Tekton surfaces data on real runs and in Tekton Results:
 * 1. status.pipelineSpec (reconciled / archived snapshot)
 * 2. spec.pipelineSpec (inline pipeline — was dropped from normalized history until spec.pipelineSpec was preserved)
 * 3. Minimal tasks from status.childReferences when specs are missing (edges unknown; nodes still render)
 */
export function getPipelineRunTaskGraphDefinitions(
  pipelineRun: PipelineRun | undefined
): PipelineRunTaskGraphDefinitions {
  if (!pipelineRun) {
    return { allTasks: [], mainTasks: [], finallyTasks: [] };
  }

  const statusSpec = pipelineRun.status?.pipelineSpec;
  const specSpec = pipelineRun.spec?.pipelineSpec;

  let mainTasks: PipelineTask[] =
    statusSpec?.tasks && statusSpec.tasks.length > 0 ? statusSpec.tasks : (specSpec?.tasks ?? []);
  let finallyTasks: PipelineTask[] =
    statusSpec?.finally && statusSpec.finally.length > 0 ? statusSpec.finally : (specSpec?.finally ?? []);

  if (mainTasks.length === 0 && finallyTasks.length === 0 && pipelineRun.status?.childReferences?.length) {
    const names = [
      ...new Set(
        pipelineRun.status.childReferences
          .filter((ref) => ref.pipelineTaskName && ref.kind !== "Run")
          .map((ref) => ref.pipelineTaskName as string)
      ),
    ];
    mainTasks = names.map((name) => ({ name }));
  }

  return {
    mainTasks,
    finallyTasks,
    allTasks: [...mainTasks, ...finallyTasks],
  };
}
