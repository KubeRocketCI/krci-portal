import { Grid, Stack } from "@mui/material";
import React from "react";
import { MenuAccordion } from "./components/MenuAccordion";
import { TaskRunStepWrapper } from "./components/TaskRunStepWrapper";
import { TaskRunWrapper } from "./components/TaskRunWrapper";
import { routePipelineRunDetails } from "../../route";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useApprovalTaskWatchList } from "@/k8s/api/groups/KRCI/ApprovalTask";
import { useTaskRunWatchList } from "@/k8s/api/groups/Tekton/TaskRun";
import { useTaskWatchList } from "@/k8s/api/groups/Tekton/Task";
import { usePipelineRunWatchWithPageParams } from "../../hooks/data";
import { approvalTaskLabels, PipelineTask, taskRunLabels } from "@my-project/shared";
import { buildPipelineRunTasksByNameMap } from "../../hooks/utils";

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
      tasks: tasksWatch.dataArray,
      taskRuns: taskRunsWatch.dataArray,
      approvalTasks: approvalTasksWatch.dataArray,
    });
  }, [pipelineRunTasks.allTasks, tasksWatch.dataArray, taskRunsWatch.dataArray, approvalTasksWatch.dataArray]);

  const isLoading =
    pipelineRunWatch.isInitialLoading ||
    tasksWatch.isInitialLoading ||
    taskRunsWatch.isInitialLoading ||
    approvalTasksWatch.isInitialLoading;

  const queryParamTaskRun = queryParams.taskRun;
  const queryParamStep = queryParams.step;

  const renderDetails = React.useCallback(() => {
    const initialTaskRunName = pipelineRunTasks?.allTasks?.[0]?.name;

    const activePipelineRunTaskData = pipelineRunTasksByNameMap?.get(queryParamTaskRun || initialTaskRunName);

    if (!queryParamTaskRun || (queryParamTaskRun && !queryParamStep)) {
      return <TaskRunWrapper pipelineRunTaskData={activePipelineRunTaskData} />;
    } else if (queryParamTaskRun && queryParamStep) {
      return <TaskRunStepWrapper pipelineRunTaskData={activePipelineRunTaskData} stepName={queryParamStep} />;
    }

    return null;
  }, [pipelineRunTasks, pipelineRunTasksByNameMap, queryParamStep, queryParamTaskRun]);

  return (
    <LoadingWrapper isLoading={isLoading}>
      <Grid container rowSpacing={3}>
        <Grid item xs={2}>
          <Stack>
            {pipelineRunTasksByNameMap &&
              pipelineRunTasks!.allTasks?.map(({ name: taskRunName }) =>
                taskRunName ? (
                  <MenuAccordion
                    key={taskRunName}
                    pipelineRunTasksByNameMap={pipelineRunTasksByNameMap}
                    taskRunName={taskRunName}
                  />
                ) : null
              )}
          </Stack>
        </Grid>
        <Grid item xs={10}>
          {renderDetails()}
        </Grid>
      </Grid>
    </LoadingWrapper>
  );
};
