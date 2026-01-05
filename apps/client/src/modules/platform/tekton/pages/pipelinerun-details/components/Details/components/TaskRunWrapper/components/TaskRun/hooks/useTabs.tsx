import { TaskRun, Task } from "@my-project/shared";
import React from "react";
import { TabContent } from "../../../../TabContent";
import CodeEditor from "@/core/components/CodeEditor";
import { NameValueTable } from "@/core/components/NameValueTable";

export const useTabs = ({ taskRun, task }: { taskRun: TaskRun; task: Task }) => {
  const results = taskRun?.status?.results;
  const taskRunIsLoaded = !!taskRun;
  const hasParams = taskRun?.spec?.params && taskRun?.spec?.params.length > 0;
  const hasResults = results && results.length > 0;

  return React.useMemo(() => {
    return [
      ...(hasParams
        ? [
            {
              label: "Parameters",
              component: (
                <TabContent>
                  <NameValueTable
                    rows={(taskRun?.spec?.params || []).map((el) => ({
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
        component: (
          <CodeEditor
            content={taskRunIsLoaded ? taskRun?.status : { steps: task?.spec?.steps?.map((el) => el.name) }}
          />
        ),
      },
    ];
  }, [hasParams, hasResults, results, task, taskRun?.spec?.params, taskRun?.status, taskRunIsLoaded]);
};
