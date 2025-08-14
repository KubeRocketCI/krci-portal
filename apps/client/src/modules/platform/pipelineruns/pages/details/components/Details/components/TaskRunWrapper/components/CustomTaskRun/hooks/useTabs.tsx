import React from "react";
import { TabContent } from "../../../../TabContent";
import { TaskRun, CustomRun } from "@my-project/shared";
import CodeEditor from "@/core/components/CodeEditor";
import { NameValueTable } from "@/core/components/NameValueTable";

export const useTabs = ({ taskRun }: { taskRun: TaskRun | CustomRun | undefined }) => {
  const results = taskRun?.status?.results;
  const hasParams = taskRun?.spec?.params && taskRun?.spec?.params.length > 0;
  const hasResults = results && results.length > 0;

  return React.useMemo(() => {
    if (!taskRun) {
      return [];
    }

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
        component: <CodeEditor content={taskRun?.status || {}} />,
      },
    ];
  }, [hasParams, hasResults, results, taskRun]);
};
