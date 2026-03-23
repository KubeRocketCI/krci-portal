import CodeEditor from "@/core/components/CodeEditor";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Badge } from "@/core/components/ui/badge";
import { Task, TaskRun, getTaskRunStepStatus } from "@my-project/shared";
import { getStepStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils/getStepStatusIcon";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { formatDuration, formatTimestamp } from "@/core/utils/date-humanize";
import React from "react";
import { ScrollText, FileText, Clock, Timer, Terminal, Circle } from "lucide-react";
import { TabContent } from "../../TabContent";
import { UnifiedTaskRunLogs } from "../../../../../../../components/UnifiedTaskRunLogs";
import type { UnifiedTaskRunLogsProps } from "../../../../../../../components/UnifiedTaskRunLogs";
import { usePipelineRunContext } from "../../../../../providers/PipelineRun/hooks";

/**
 * Unified step tabs hook.
 * Computes an upfront logRoute decision and passes it to UnifiedTaskRunLogs.
 */
export function useUnifiedStepTabs({
  taskRun,
  task,
  stepName,
  taskName,
}: {
  taskRun: TaskRun | undefined;
  task: Task | undefined;
  stepName: string;
  taskName: string;
}) {
  const { source, resultUid, pipelineRun } = usePipelineRunContext();

  const details = taskRun
    ? taskRun?.status?.taskSpec?.steps.find((el: { name: string }) => el.name === stepName)
    : task?.spec?.steps?.find((el: { name: string }) => el.name === stepName);

  const step = taskRun
    ? taskRun?.status?.steps?.find((s) => s?.name === stepName)
    : task?.spec?.steps?.find((s) => s?.name === stepName);

  const namespace = pipelineRun?.metadata?.namespace || "";
  const taskRunName = taskRun?.metadata?.name || "";
  const completionTime = pipelineRun?.status?.completionTime;

  return React.useMemo(() => {
    const taskRunStepStatus = getTaskRunStepStatus(step);
    const stepStatusIcon = step ? getStepStatusIcon(step) : { component: Circle, color: "#94a3b8", isSpinning: false };

    const startTime = taskRunStepStatus.startedAt;
    const finishedAt = taskRunStepStatus.finishedAt;
    const startedAt = startTime ? formatTimestamp(startTime) : null;
    const duration = startTime ? formatDuration(startTime, finishedAt || undefined) : null;
    const exitCode =
      step && "terminated" in step ? (step as { terminated?: { exitCode?: number } }).terminated?.exitCode : undefined;
    const reason = capitalizeFirstLetter(taskRunStepStatus.reason || taskRunStepStatus.status || "unknown");
    const isPending = !startTime;

    let logsProps: UnifiedTaskRunLogsProps | null = null;

    if (source === "history" && resultUid) {
      logsProps = {
        logRoute: "history",
        stepName,
        taskRunName,
        resultUid,
        namespace,
      };
    } else if (source === "live") {
      if (!completionTime) {
        logsProps = {
          logRoute: "running",
          stepName,
          taskRunName,
          namespace,
        };
      } else if (resultUid) {
        // Completed + archived -> stored logs
        logsProps = {
          logRoute: "history",
          stepName,
          taskRunName,
          resultUid,
          namespace,
        };
      } else {
        logsProps = { logRoute: "archiving" };
      }
    }

    const logsComponent = logsProps ? (
      <TabContent>
        <UnifiedTaskRunLogs {...logsProps} />
      </TabContent>
    ) : null;

    return [
      {
        label: "Logs",
        icon: <ScrollText className="size-4" />,
        component: logsComponent,
      },
      {
        label: "Details",
        icon: <FileText className="size-4" />,
        component: (
          <TabContent>
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon
                    Icon={stepStatusIcon.component}
                    color={stepStatusIcon.color}
                    isSpinning={stepStatusIcon.isSpinning}
                    width={20}
                  />
                  <div>
                    <h3 className="text-foreground text-base font-medium">{stepName}</h3>
                    <span className="text-muted-foreground text-xs">Task: {taskName}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {reason}
                </Badge>
              </div>
              {!isPending && (startedAt || duration || exitCode !== undefined) && (
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
            <CodeEditor content={details} />
          </TabContent>
        ),
      },
    ];
  }, [details, step, stepName, taskName, taskRunName, namespace, source, resultUid, completionTime]);
}
