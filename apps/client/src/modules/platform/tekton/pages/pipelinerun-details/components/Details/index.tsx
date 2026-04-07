import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PipelineTask } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { router } from "@/core/router";
import { routePipelineRunDetails, routeSearchTabName, PATH_PIPELINERUN_DETAILS_FULL } from "../../route";
import { usePipelineRunContext } from "../../providers/PipelineRun/hooks";
import { MenuAccordionView } from "./components/MenuAccordion";
import { UnifiedTaskRunWrapper } from "./components/UnifiedTaskRunWrapper";
import { UnifiedTaskRunStepWrapper } from "./components/UnifiedTaskRunStepWrapper";

export function Details() {
  const params = routePipelineRunDetails.useParams();
  const queryParams = routePipelineRunDetails.useSearch();
  const { pipelineRunTasks, pipelineRunTasksByNameMap, isLoading } = usePipelineRunContext();

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
        search: (prev) => ({ ...prev, taskRun: firstTaskName, tab: routeSearchTabName.details }),
        replace: true,
        resetScroll: false,
      });
    }
  }, [queryParamTaskRun, firstTaskName, isLoading, params.clusterName, params.namespace, params.name]);

  const tasksCompletedCount = React.useMemo(() => {
    let completed = 0;
    pipelineRunTasksByNameMap.forEach((data) => {
      const taskRun = data.taskRun;
      const reason = taskRun?.status?.conditions?.[0]?.reason;
      if (reason?.toLowerCase() === "succeeded") {
        completed++;
      }
    });
    return completed;
  }, [pipelineRunTasksByNameMap]);

  const handleNavigate = React.useCallback(
    (taskRunName: string, taskRunStepName?: string) => {
      router.navigate({
        to: PATH_PIPELINERUN_DETAILS_FULL,
        params: {
          clusterName: params.clusterName,
          namespace: params.namespace,
          name: params.name,
        },
        search: (prev) => ({ ...prev, taskRun: taskRunName, step: taskRunStepName, tab: routeSearchTabName.details }),
        resetScroll: false,
      });
    },
    [params.clusterName, params.name, params.namespace]
  );

  const activePipelineRunTaskData = queryParamTaskRun ? pipelineRunTasksByNameMap.get(queryParamTaskRun) : undefined;

  return (
    <LoadingWrapper isLoading={isLoading}>
      <div className="flex h-full gap-6">
        <div className="w-[25%] flex-shrink-0">
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
                  pipelineRunTasks.allTasks?.map(({ name: taskRunName }: PipelineTask) =>
                    taskRunName ? (
                      <MenuAccordionView
                        key={taskRunName}
                        pipelineRunTasksByNameMap={pipelineRunTasksByNameMap}
                        taskRunName={taskRunName}
                        queryParamTaskRun={queryParamTaskRun}
                        queryParamStep={queryParamStep}
                        onNavigate={handleNavigate}
                      />
                    ) : null
                  )}
              </div>
            </div>
          </Card>
        </div>

        {/* Main content - Task/Step Details */}
        <div className="min-w-0 flex-1">
          {activePipelineRunTaskData && !queryParamStep && (
            <UnifiedTaskRunWrapper pipelineRunTaskData={activePipelineRunTaskData} />
          )}
          {activePipelineRunTaskData && queryParamStep && (
            <UnifiedTaskRunStepWrapper pipelineRunTaskData={activePipelineRunTaskData} stepName={queryParamStep} />
          )}
        </div>
      </div>
    </LoadingWrapper>
  );
}
