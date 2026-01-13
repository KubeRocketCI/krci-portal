import React from "react";
import { router } from "@/core/router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { Details } from "../Details";
import { TasksTab } from "../TasksTab";
import { useTektonResultTaskListQuery } from "../../hooks/data";
import {
  routeTektonResultPipelineRunDetails,
  routeSearchTabName,
  routeSearchLogViewName,
  PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL,
} from "../../route";

export const Logs = () => {
  const params = routeTektonResultPipelineRunDetails.useParams();
  const queryParams = routeTektonResultPipelineRunDetails.useSearch();
  const taskListQuery = useTektonResultTaskListQuery();

  const activeLogView = queryParams.logView ?? routeSearchLogViewName.tasks;
  const tasks = taskListQuery.data?.tasks || [];
  const firstTask = tasks[0];

  const handleLogViewChange = React.useCallback(
    (logView: string) => {
      // When switching to tasks view without a selected task, select the first one
      const shouldSelectFirstTask = logView === "tasks" && !queryParams.taskRun && firstTask;

      router.navigate({
        to: PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL,
        params,
        search: {
          tab: routeSearchTabName.logs,
          logView: logView as "all" | "tasks",
          taskRun: logView === "all" ? undefined : shouldSelectFirstTask ? firstTask.taskRunName : queryParams.taskRun,
        },
        resetScroll: false,
      });
    },
    [params, queryParams.taskRun, firstTask]
  );

  return (
    <div className="flex h-full flex-col">
      <Tabs value={activeLogView} onValueChange={handleLogViewChange}>
        <TabsList className="w-full justify-start border-b">
          <TabsTrigger value={routeSearchLogViewName.tasks}>Task Logs</TabsTrigger>
          <TabsTrigger value={routeSearchLogViewName.all}>All Logs</TabsTrigger>
        </TabsList>

        <TabsContent value={routeSearchLogViewName.tasks} className="flex-1">
          <TasksTab />
        </TabsContent>

        <TabsContent value={routeSearchLogViewName.all} className="flex-1">
          <Details />
        </TabsContent>
      </Tabs>
    </div>
  );
};
