import { usePipelineRunWatchItem } from "@/k8s/api/groups/Tekton/PipelineRun";
import { ApprovalTask, PipelineTask, Task, TaskRun } from "@my-project/shared";
import { routePipelineRunDetails } from "../route";
import { usePipelineRunLogsQuery } from "@/k8s/krakend/hooks/usePipelineRunLogs";

export type PipelineRunTaskData = {
  pipelineRunTask: PipelineTask;
  task: Task;
  taskRun: TaskRun;
  approvalTask: ApprovalTask;
};

export type PipelineRunTaskCombinedData = {
  pipelineRunTasks: {
    allTasks: Task[];
    mainTasks: Task[];
    finallyTasks: Task[];
  };
  pipelineRunTasksByNameMap: Map<string, PipelineRunTaskData>;
};

export const usePipelineRunWatchWithPageParams = () => {
  const params = routePipelineRunDetails.useParams();

  return usePipelineRunWatchItem({
    namespace: params.namespace,
    name: params.name,
  });
};

export const usePipelineRunLogsQueryWithPageParams = () => {
  const params = routePipelineRunDetails.useParams();
  
  return usePipelineRunLogsQuery(params.clusterName, params.namespace, params.name);
};
