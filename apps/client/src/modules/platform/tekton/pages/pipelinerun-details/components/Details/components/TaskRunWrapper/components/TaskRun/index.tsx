import { useTabs } from "./hooks/useTabs";
import { TaskRunProps } from "./types";
import { taskRunLabels } from "@my-project/shared";
import { humanize } from "@/core/utils/date-humanize";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { Card } from "@/core/components/ui/card";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getPipelineTaskStatusDisplay } from "@/modules/platform/tekton/utils/getPipelineTaskStatusDisplay";
import { Badge } from "@/core/components/ui/badge";
import { Timer, Clock } from "lucide-react";
import { getTaskDescription } from "../../../../../../../../utils/getTaskDescription";

export const TaskRun = ({ pipelineRunTaskData }: TaskRunProps) => {
  const { run, task, pipelineRunTask } = pipelineRunTaskData;
  const taskRunName = run?.metadata?.labels?.[taskRunLabels.pipelineTask] ?? pipelineRunTask?.name;
  const taskRunStatusDisplay = getPipelineTaskStatusDisplay(pipelineRunTaskData);

  const completionTime = run?.status?.completionTime || "";
  const startTime = run?.status?.startTime || "";

  const duration =
    startTime && completionTime
      ? humanize(new Date(completionTime).getTime() - new Date(startTime).getTime(), {
          language: "en-mini",
          spacer: "",
          delimiter: " ",
          fallbacks: ["en"],
          largest: 2,
          round: true,
          units: ["d", "h", "m", "s"],
        })
      : startTime
        ? humanize(new Date().getTime() - new Date(startTime).getTime(), {
            language: "en-mini",
            spacer: "",
            delimiter: " ",
            fallbacks: ["en"],
            largest: 2,
            round: true,
            units: ["d", "h", "m", "s"],
          })
        : null;

  const startedAt = startTime
    ? new Date(startTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : null;

  const tabs = useTabs({ taskRun: run, task, pipelineRunTask });
  const taskDescription = getTaskDescription(
    pipelineRunTaskData.task,
    pipelineRunTaskData.taskRun,
    pipelineRunTaskData.pipelineRunTask
  );
  const { activeTab, handleChangeTab } = useTabsContext();

  return (
    <Card className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex gap-3">
            <StatusIcon
              Icon={taskRunStatusDisplay.component}
              color={taskRunStatusDisplay.color}
              isSpinning={taskRunStatusDisplay.isSpinning}
              width={20}
            />
            <div>
              <h3 className="text-foreground text-lg font-medium">{taskRunName}</h3>
              {taskDescription && <p className="text-muted-foreground mt-0.5 text-sm">{taskDescription}</p>}
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {taskRunStatusDisplay.label}
          </Badge>
        </div>

        <div className="flex items-center gap-6">
          {startedAt && (
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground text-sm">Started: {startedAt}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-2">
              <Timer className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground text-sm">Duration: {duration}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </div>
    </Card>
  );
};
