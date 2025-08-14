import CodeEditor from "@/core/components/CodeEditor";
import { Task, TaskRun } from "@my-project/shared";
import React from "react";
import { TabContent } from "../../TabContent";
import { TaskRunStepLogs } from "../components/TaskRunStepLogs";

export const useTabs = ({
  taskRun,
  task,
  stepName,
}: {
  taskRun: TaskRun | undefined;
  task: Task | undefined;
  stepName: string;
}) => {
  const details = taskRun
    ? taskRun?.status?.taskSpec?.steps.find((el: { name: string }) => el.name === stepName)
    : task?.spec?.steps?.find((el: { name: string }) => el.name === stepName);

  return React.useMemo(() => {
    return [
      {
        label: "Logs",
        component: (
          <TabContent>
            <TaskRunStepLogs stepName={stepName} taskRunName={taskRun?.metadata?.name || ""} />
          </TabContent>
        ),
      },
      {
        label: "Details",
        component: (
          <TabContent>
            <CodeEditor content={details} />
          </TabContent>
        ),
      },
    ];
  }, [details, stepName, taskRun?.metadata?.name]);
};
