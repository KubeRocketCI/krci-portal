import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import type { PipelineRunTaskData } from "../../../../hooks/types";
import { usePipelineRunContext } from "../../../../providers/PipelineRun/hooks";
import { CustomTaskRun } from "../TaskRunWrapper/components/CustomTaskRun";
import { TaskRun } from "../TaskRunWrapper/components/TaskRun";

interface UnifiedTaskRunWrapperProps {
  pipelineRunTaskData: PipelineRunTaskData;
}

/**
 * Unified TaskRun wrapper that works for both live and history data.
 *
 * For live data with approval tasks, renders the existing CustomTaskRun component
 * (which handles approval actions via K8s API).
 *
 * For history data, approval tasks are rendered as a regular task (no approval
 * actions since those are K8s-only operations).
 */
export function UnifiedTaskRunWrapper({ pipelineRunTaskData }: UnifiedTaskRunWrapperProps) {
  const { source } = usePipelineRunContext();
  const isApprovalTask = !!pipelineRunTaskData?.approvalTask;

  // For live data with approval tasks, use the existing CustomTaskRun component
  // which handles K8s operations (approve/reject)
  const showCustomTaskRun = isApprovalTask && source === "live";

  return (
    <TabsContextProvider id="unified-pipeline-details-page-inner-taskrun" initialTabIdx={0}>
      {showCustomTaskRun && pipelineRunTaskData ? (
        <CustomTaskRun pipelineRunTaskData={pipelineRunTaskData} />
      ) : (
        <TaskRun pipelineRunTaskData={pipelineRunTaskData} />
      )}
    </TabsContextProvider>
  );
}
