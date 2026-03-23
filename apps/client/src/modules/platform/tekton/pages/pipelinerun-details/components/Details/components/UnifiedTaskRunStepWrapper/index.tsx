import type { PipelineRunTaskData } from "../../../../hooks/types";
import { TaskRunStepView } from "../TaskRunStepView";
import { useUnifiedStepTabs } from "./hooks/useUnifiedStepTabs";

interface UnifiedTaskRunStepWrapperProps {
  pipelineRunTaskData: PipelineRunTaskData;
  stepName: string;
}

/**
 * Unified step wrapper for the Details tab.
 * Renders step header and tabs (Logs, Details).
 * For live data, logs stream from pods. For history, logs come from Tekton Results.
 */
export function UnifiedTaskRunStepWrapper({ pipelineRunTaskData, stepName }: UnifiedTaskRunStepWrapperProps) {
  const tabs = useUnifiedStepTabs({
    taskRun: pipelineRunTaskData?.taskRun,
    stepName: stepName,
    task: pipelineRunTaskData?.task,
    taskName: pipelineRunTaskData?.task?.metadata?.name || "",
  });

  return <TaskRunStepView tabs={tabs} tabsContextId="unified-pipeline-details-page-inner-taskrun-step" />;
}
