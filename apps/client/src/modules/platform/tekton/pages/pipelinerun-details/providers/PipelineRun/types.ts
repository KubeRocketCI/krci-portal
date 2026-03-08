import type { PipelineRunTaskData } from "../../hooks/types";
import type { PipelineRun, PipelineTask } from "@my-project/shared";
import type { RequestError } from "@/core/types/global";

/** The data source for the unified pipeline run view */
export type UnifiedSource = "live" | "history";

export interface UnifiedPipelineRunData {
  /** The normalized PipelineRun (K8s type, whether from live or history) */
  pipelineRun: PipelineRun | undefined;
  /** Task data grouped by pipeline task name */
  pipelineRunTasks: {
    allTasks: PipelineTask[];
    mainTasks: PipelineTask[];
    finallyTasks: PipelineTask[];
  };
  /** Map of pipeline task name to combined task data (taskRun, task, approvalTask) */
  pipelineRunTasksByNameMap: Map<string, PipelineRunTaskData>;
  /** Where the data came from */
  source: UnifiedSource | null;
  /** Tekton Results result UID. Set from search (history) or from annotation (live). */
  resultUid: string | undefined;
  recordUid: string | undefined;
  /** True during initial data loading */
  isLoading: boolean;
  /** True when data has been successfully resolved */
  isReady: boolean;
  /** Error if both live and history failed */
  error: RequestError | Error | null;
  /** True when the PipelineRun was not found in the cluster (K8s 404) */
  isK8sNotFound: boolean;
}
