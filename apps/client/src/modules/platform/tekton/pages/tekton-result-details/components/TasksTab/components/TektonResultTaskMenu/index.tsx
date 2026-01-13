import { router } from "@/core/router";
import { cn } from "@/core/utils/classname";
import { TektonResultTask } from "@my-project/shared";
import {
  routeTektonResultPipelineRunDetails,
  routeSearchTabName,
  routeSearchLogViewName,
  PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL,
} from "../../../../route";

interface TektonResultTaskMenuProps {
  tasks: TektonResultTask[];
  selectedTaskRunName?: string;
}

export const TektonResultTaskMenu = ({ tasks, selectedTaskRunName }: TektonResultTaskMenuProps) => {
  const params = routeTektonResultPipelineRunDetails.useParams();

  const handleTaskClick = (taskRunName: string) => {
    router.navigate({
      to: PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL,
      params: {
        clusterName: params.clusterName,
        namespace: params.namespace,
        resultUid: params.resultUid,
        recordUid: params.recordUid,
      },
      search: {
        tab: routeSearchTabName.logs,
        logView: routeSearchLogViewName.tasks,
        taskRun: taskRunName,
      },
      resetScroll: false,
    });
  };

  if (tasks.length === 0) {
    return <div className="text-muted-foreground p-4 text-center text-sm">No tasks found</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {tasks.map((task) => {
        const isSelected = selectedTaskRunName === task.taskRunName;

        return (
          <button
            key={task.taskRunName}
            onClick={() => handleTaskClick(task.taskRunName)}
            className={cn(
              "text-foreground flex w-full items-center gap-2 rounded-lg p-3 text-left text-sm transition-colors",
              isSelected && "bg-primary/10 border-primary/30 border-2",
              !isSelected && "bg-card border-border hover:bg-muted border"
            )}
          >
            <span className="truncate">{task.taskName}</span>
          </button>
        );
      })}
    </div>
  );
};
