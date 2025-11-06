import { useTabs } from "./hooks/useTabs";
import { TaskRunProps } from "./types";
import { getTaskRunStatus, taskRunLabels } from "@my-project/shared";
import { humanize } from "@/core/utils/date-humanize";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";

export const TaskRun = ({ pipelineRunTaskData }: TaskRunProps) => {
  const { taskRun, task } = pipelineRunTaskData;
  const taskRunName = taskRun?.metadata?.labels?.[taskRunLabels.pipelineTask];
  const taskRunStatus = getTaskRunStatus(taskRun);

  const completionTime = taskRun?.status?.completionTime || "";
  const startTime = taskRun?.status?.startTime || "";

  const duration = humanize(new Date(completionTime).getTime() - new Date(startTime).getTime(), {
    language: "en-mini",
    spacer: "",
    delimiter: " ",
    fallbacks: ["en"],
    largest: 2,
    round: true,
    units: ["d", "h", "m", "s"],
  });

  const tabs = useTabs({ taskRun, task });

  const taskDescription = pipelineRunTaskData.task?.spec?.description || "";

  const { activeTab, handleChangeTab } = useTabsContext();

  return (
    <div className="bg-card rounded shadow">
      <div className="p-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-medium">{taskRunName}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-foreground text-sm font-medium">
              Status: <span className="text-muted-foreground text-sm">{taskRunStatus.reason}</span>
            </span>
            <span className="text-foreground text-sm font-medium">
              Duration: <span className="text-muted-foreground text-sm">{duration}</span>
            </span>
          </div>
          {taskDescription && (
            <span className="text-foreground text-sm font-medium">
              Description: <span className="text-muted-foreground text-sm">{taskDescription}</span>
            </span>
          )}
        </div>
      </div>
      <hr className="border-border" />
      <div className="px-6 pb-6">
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </div>
    </div>
  );
};
