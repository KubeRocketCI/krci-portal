import CodeEditor from "@/core/components/CodeEditor";
import { Task, TaskRun } from "@my-project/shared";
import React from "react";
import { ScrollText, FileText } from "lucide-react";
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
}: {
  taskRun: TaskRun | undefined;
  task: Task | undefined;
  stepName: string;
}) {
  const { source, resultUid, pipelineRun } = usePipelineRunContext();

  const details = taskRun
    ? taskRun?.status?.taskSpec?.steps.find((el: { name: string }) => el.name === stepName)
    : task?.spec?.steps?.find((el: { name: string }) => el.name === stepName);

  const namespace = pipelineRun?.metadata?.namespace || "";
  const taskRunName = taskRun?.metadata?.name || "";
  const completionTime = pipelineRun?.status?.completionTime;

  return React.useMemo(() => {
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
        // Running pipeline -> stream live pod logs
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
        // Completed but not yet archived -> archiving spinner
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
            <CodeEditor content={details} />
          </TabContent>
        ),
      },
    ];
  }, [details, stepName, taskRunName, namespace, source, resultUid, completionTime]);
}
