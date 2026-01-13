import { humanize } from "@/core/utils/date-humanize";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getTaskRunStepStatus } from "@my-project/shared";
import { TaskRunStep } from "./components/TaskRunStep";
import { useTabs } from "./hooks/useTabs";
import { TaskRunStepProps } from "./types";
import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { Card } from "@/core/components/ui/card";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getStepStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon";
import { Badge } from "@/core/components/ui/badge";
import { Timer, Terminal, Clock, Circle } from "lucide-react";

export const TaskRunStepWrapper = ({ pipelineRunTaskData, stepName }: TaskRunStepProps) => {
  const step = pipelineRunTaskData?.taskRun
    ? pipelineRunTaskData.taskRun?.status?.steps?.find((step) => step?.name === stepName)
    : pipelineRunTaskData?.task?.spec?.steps?.find((step) => step?.name === stepName);

  const taskRunStepStatus = getTaskRunStepStatus(step);
  const stepStatusIcon = step ? getStepStatusIcon(step) : { component: Circle, color: "#94a3b8", isSpinning: false };

  const completionTime = taskRunStepStatus.finishedAt;
  const startTime = taskRunStepStatus.startedAt;

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

  const tabs = useTabs({
    taskRun: pipelineRunTaskData?.taskRun,
    stepName: step?.name || "",
    task: pipelineRunTaskData?.task,
  });

  const taskName = pipelineRunTaskData?.task?.metadata?.name || "";
  const isPending = !taskRunStepStatus.startedAt;
  const exitCode =
    step && "terminated" in step ? (step as { terminated?: { exitCode?: number } }).terminated?.exitCode : undefined;

  return (
    <Card className="flex h-full flex-col">
      {/* Step header */}
      <div className="border-b px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon
              Icon={stepStatusIcon.component}
              color={stepStatusIcon.color}
              isSpinning={stepStatusIcon.isSpinning}
              width={20}
            />
            <div>
              <h3 className="text-foreground text-lg font-medium">{step?.name}</h3>
              <span className="text-muted-foreground text-xs">Task: {taskName}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {capitalizeFirstLetter(taskRunStepStatus.reason || taskRunStepStatus.status || "unknown")}
          </Badge>
        </div>

        {/* Step metadata */}
        {!isPending && (
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
            {exitCode !== undefined && (
              <div className="flex items-center gap-2">
                <Terminal className="text-muted-foreground size-3.5" />
                <span className="text-muted-foreground text-sm">Exit Code: {exitCode}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs content */}
      <div className="flex flex-1 flex-col p-4">
        <TabsContextProvider id="pipeline-details-page-inner-taskrun-step">
          <TaskRunStep tabs={tabs} />
        </TabsContextProvider>
      </div>
    </Card>
  );
};
