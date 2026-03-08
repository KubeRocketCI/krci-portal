import { TaskRun, Task, PipelineTask } from "@my-project/shared";
import React from "react";
import { Settings, CheckCircle, Info } from "lucide-react";
import { TabContent } from "../../../../TabContent";
import CodeEditor from "@/core/components/CodeEditor";
import { NameValueTable } from "@/core/components/NameValueTable";

export const useTabs = ({
  taskRun,
  task,
  pipelineRunTask,
}: {
  taskRun: TaskRun | undefined;
  task?: Task;
  pipelineRunTask?: PipelineTask;
}) => {
  const results = taskRun?.status?.results;
  const taskRunIsLoaded = !!taskRun;

  // Show params from taskRun if available, otherwise from pipelineRunTask definition
  const params = taskRun?.spec?.params ?? pipelineRunTask?.params;
  const hasParams = params && params.length > 0;
  const hasResults = results && results.length > 0;

  return React.useMemo(() => {
    return [
      ...(hasParams
        ? [
            {
              label: "Parameters",
              icon: <Settings className="size-4" />,
              component: (
                <TabContent>
                  <NameValueTable
                    rows={(params || []).map((el) => ({
                      name: el.name,
                      value: el.value,
                    }))}
                  />
                </TabContent>
              ),
            },
          ]
        : []),
      ...(hasResults
        ? [
            {
              label: "Results",
              icon: <CheckCircle className="size-4" />,
              component: (
                <TabContent>
                  <NameValueTable
                    rows={(results || []).map((el) => ({
                      name: el.name,
                      value: el.value,
                    }))}
                  />
                </TabContent>
              ),
            },
          ]
        : []),
      {
        label: "Status",
        icon: <Info className="size-4" />,
        component: (
          <CodeEditor
            content={
              taskRunIsLoaded
                ? taskRun?.status
                : task?.spec?.steps
                  ? { steps: task.spec.steps.map((el) => el.name) }
                  : buildPendingTaskSummary(pipelineRunTask)
            }
          />
        ),
      },
    ];
  }, [hasParams, hasResults, results, task, params, taskRun?.status, taskRunIsLoaded, pipelineRunTask]);
};

/**
 * Build a summary object for pending tasks that haven't started yet.
 * Shows useful info from the PipelineTask definition.
 */
function buildPendingTaskSummary(pipelineRunTask?: PipelineTask) {
  if (!pipelineRunTask) return {};

  const summary: Record<string, unknown> = {
    status: "Pending",
  };

  if (pipelineRunTask.taskRef?.name) {
    summary.taskRef = pipelineRunTask.taskRef;
  }

  if (pipelineRunTask.runAfter?.length) {
    summary.runAfter = pipelineRunTask.runAfter;
  }

  if (pipelineRunTask.when?.length) {
    summary.when = pipelineRunTask.when;
  }

  if (pipelineRunTask.workspaces?.length) {
    summary.workspaces = pipelineRunTask.workspaces;
  }

  if (pipelineRunTask.timeout) {
    summary.timeout = pipelineRunTask.timeout;
  }

  if (pipelineRunTask.retries) {
    summary.retries = pipelineRunTask.retries;
  }

  return summary;
}
