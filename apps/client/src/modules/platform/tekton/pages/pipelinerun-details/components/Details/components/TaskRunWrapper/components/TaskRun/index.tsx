import { useTabs } from "./hooks/useTabs";
import { TaskRunProps } from "./types";
import { getTaskRunStatus, taskRunLabels } from "@my-project/shared";
import { humanize } from "@/core/utils/date-humanize";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { Card } from "@/core/components/ui/card";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getTaskRunStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { Badge } from "@/core/components/ui/badge";
import { Timer, Clock, ShieldQuestion } from "lucide-react";
import { getTaskDescription } from "../../../../../../../../utils/getTaskDescription";

export const TaskRun = ({ pipelineRunTaskData }: TaskRunProps) => {
  const { taskRun, task, pipelineRunTask } = pipelineRunTaskData;
  const taskRunName = taskRun?.metadata?.labels?.[taskRunLabels.pipelineTask] ?? pipelineRunTask?.name;
  const taskRunStatus = getTaskRunStatus(taskRun);
  const taskRunStatusIcon = taskRun
    ? getTaskRunStatusIcon(taskRun)
    : { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN };

  const completionTime = taskRun?.status?.completionTime || "";
  const startTime = taskRun?.status?.startTime || "";

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

  const tabs = useTabs({ taskRun, task, pipelineRunTask });
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
              Icon={taskRunStatusIcon.component}
              color={taskRunStatusIcon.color}
              isSpinning={taskRunStatusIcon.isSpinning}
              width={20}
            />
            <div>
              <h3 className="text-foreground text-lg font-medium">{taskRunName}</h3>
              {taskDescription && <p className="text-muted-foreground mt-0.5 text-sm">{taskDescription}</p>}
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {taskRunStatus.reason}
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
