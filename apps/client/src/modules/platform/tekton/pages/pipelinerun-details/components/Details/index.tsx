import React from "react";
import { MenuAccordion } from "./components/MenuAccordion";
import { TaskRunStepWrapper } from "./components/TaskRunStepWrapper";
import { TaskRunWrapper } from "./components/TaskRunWrapper";
import { routePipelineRunDetails, routeSearchTabName, PATH_PIPELINERUN_DETAILS_FULL } from "../../route";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useApprovalTaskWatchList } from "@/k8s/api/groups/KRCI/ApprovalTask";
import { useTaskRunWatchList } from "@/k8s/api/groups/Tekton/TaskRun";
import { useTaskWatchList } from "@/k8s/api/groups/Tekton/Task";
import { usePipelineRunWatchWithPageParams } from "../../hooks/data";
import { approvalTaskLabels, PipelineTask, taskRunLabels } from "@my-project/shared";
import { buildPipelineRunTasksByNameMap } from "../../hooks/utils";
import { Card } from "@/core/components/ui/card";
import { router } from "@/core/router";

export const Details = () => {
  const params = routePipelineRunDetails.useParams();
  const queryParams = routePipelineRunDetails.useSearch();

  const pipelineRunWatch = usePipelineRunWatchWithPageParams();

  const taskRunsWatch = useTaskRunWatchList({
    namespace: params.namespace,
    labels: {
      [taskRunLabels.parentPipelineRun]: params.name,
    },
  });

  const tasksWatch = useTaskWatchList({
    namespace: params.namespace,
  });

  const approvalTasksWatch = useApprovalTaskWatchList({
    namespace: params.namespace,
    labels: {
      [approvalTaskLabels.parentPipelineRun]: params.name,
    },
  });

  const pipelineRun = pipelineRunWatch.query.data;

  const pipelineRunTasks = React.useMemo(() => {
    const mainTasks: PipelineTask[] = pipelineRun?.status?.pipelineSpec?.tasks || [];
    const finallyTasks: PipelineTask[] = pipelineRun?.status?.pipelineSpec?.finally || [];

    return {
      allTasks: [...mainTasks, ...finallyTasks],
      mainTasks,
      finallyTasks,
    };
  }, [pipelineRun]);

  const pipelineRunTasksByNameMap = React.useMemo(() => {
    return buildPipelineRunTasksByNameMap({
      allPipelineTasks: pipelineRunTasks.allTasks,
      tasks: tasksWatch.data.array,
      taskRuns: taskRunsWatch.data.array,
      approvalTasks: approvalTasksWatch.data.array,
    });
  }, [pipelineRunTasks.allTasks, tasksWatch.data.array, taskRunsWatch.data.array, approvalTasksWatch.data.array]);

  const isLoading =
    pipelineRunWatch.isLoading || tasksWatch.isLoading || taskRunsWatch.isLoading || approvalTasksWatch.isLoading;

  const queryParamTaskRun = queryParams.taskRun;
  const queryParamStep = queryParams.step;

  // Auto-select first task if none is selected
  const firstTaskName = pipelineRunTasks.allTasks?.[0]?.name;
  React.useEffect(() => {
    if (!queryParamTaskRun && firstTaskName && !isLoading) {
      router.navigate({
        to: PATH_PIPELINERUN_DETAILS_FULL,
        params: {
          clusterName: params.clusterName,
          namespace: params.namespace,
          name: params.name,
        },
        search: {
          taskRun: firstTaskName,
          tab: routeSearchTabName.details,
        },
        replace: true,
      });
    }
  }, [queryParamTaskRun, firstTaskName, isLoading, params.clusterName, params.namespace, params.name]);

  const tasksCompletedCount = React.useMemo(() => {
    let completed = 0;
    pipelineRunTasksByNameMap.forEach((data) => {
      const taskRun = data.taskRun;
      if (taskRun?.status?.conditions?.[0]?.reason === "succeeded") {
        completed++;
      }
    });
    return completed;
  }, [pipelineRunTasksByNameMap]);

  const renderDetails = React.useCallback(() => {
    const initialTaskRunName = pipelineRunTasks?.allTasks?.[0]?.name;

    if (!queryParamTaskRun || !initialTaskRunName) {
      return null;
    }

    const activePipelineRunTaskData = pipelineRunTasksByNameMap.get(queryParamTaskRun || initialTaskRunName);

    if (!activePipelineRunTaskData) {
      return null;
    }

    if (!queryParamTaskRun || (queryParamTaskRun && !queryParamStep)) {
      return <TaskRunWrapper pipelineRunTaskData={activePipelineRunTaskData} />;
    } else if (queryParamTaskRun && queryParamStep) {
      return <TaskRunStepWrapper pipelineRunTaskData={activePipelineRunTaskData} stepName={queryParamStep} />;
    }

    return null;
  }, [pipelineRunTasks, pipelineRunTasksByNameMap, queryParamStep, queryParamTaskRun]);

  return (
    <LoadingWrapper isLoading={isLoading}>
      <div className="flex h-full gap-6">
        {/* Sidebar - Tasks & Steps (30%) */}
        <div className="w-[30%] flex-shrink-0">
          <Card className="flex h-full flex-col">
            <div className="border-b px-4 py-3">
              <h3 className="text-foreground font-medium">Tasks & Steps</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {tasksCompletedCount} of {pipelineRunTasks.allTasks.length} tasks completed
              </p>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <div className="flex flex-col gap-1">
                {pipelineRunTasksByNameMap &&
                  pipelineRunTasks.allTasks?.map(({ name: taskRunName }) =>
                    taskRunName ? (
                      <MenuAccordion
                        key={taskRunName}
                        pipelineRunTasksByNameMap={pipelineRunTasksByNameMap}
                        taskRunName={taskRunName}
                      />
                    ) : null
                  )}
              </div>
            </div>
          </Card>
        </div>

        {/* Main content - Task/Step Details (70%) */}
        <div className="min-w-0 flex-1">{renderDetails()}</div>
      </div>
    </LoadingWrapper>
  );
};
