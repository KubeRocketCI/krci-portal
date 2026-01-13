import { Card } from "@/core/components/ui/card";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { TektonResultTaskMenu } from "./components/TektonResultTaskMenu";
import { TektonResultTaskLogsView } from "./components/TektonResultTaskLogsView";
import { useTektonResultTaskListQuery } from "../../hooks/data";
import { routeTektonResultPipelineRunDetails } from "../../route";

export const TasksTab = () => {
  const queryParams = routeTektonResultPipelineRunDetails.useSearch();
  const taskListQuery = useTektonResultTaskListQuery();

  const selectedTaskRunName = queryParams.taskRun;
  const tasks = taskListQuery.data?.tasks || [];

  return (
    <LoadingWrapper isLoading={taskListQuery.isLoading}>
      <div className="flex h-full gap-6">
        {/* Task Menu - 20% */}
        <div className="w-[20%] flex-shrink-0">
          <Card className="flex h-full flex-col">
            <div className="border-b px-4 py-3">
              <h3 className="text-foreground font-medium">Tasks</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </p>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <TektonResultTaskMenu tasks={tasks} selectedTaskRunName={selectedTaskRunName} />
            </div>
          </Card>
        </div>

        {/* Task Logs View - 80% */}
        <div className="min-w-0 flex-1">
          {selectedTaskRunName ? (
            <Card className="h-full">
              <TektonResultTaskLogsView taskRunName={selectedTaskRunName} />
            </Card>
          ) : (
            <Card className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">Select a task to view logs</p>
            </Card>
          )}
        </div>
      </div>
    </LoadingWrapper>
  );
};
