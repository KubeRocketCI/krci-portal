import { Accordion, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import React from "react";
import { Terminal } from "@/core/components/Terminal";
import { routePipelineRunDetails, PATH_PIPELINERUN_DETAILS_FULL } from "../../../../route";
import { usePipelineRunLogsQueryWithPageParams } from "../../../../hooks/data";
import { router } from "@/core/router";
import { cn } from "@/core/utils/classname";

export const LogsByTask = () => {
  const params = routePipelineRunDetails.useParams();
  const search = routePipelineRunDetails.useSearch();

  const queryParamTaskRun = search.taskRun;

  const logsQuery = usePipelineRunLogsQueryWithPageParams();
  const logs = logsQuery.data;

  const handleAccordionChange = (taskRun: string) => {
    router.navigate({
      to: PATH_PIPELINERUN_DETAILS_FULL,
      params: {
        clusterName: params.clusterName,
        namespace: params.namespace,
        name: params.name,
      },
      search: {
        taskRun: taskRun,
      },
    });
  };

  const renderDetails = React.useCallback(() => {
    if (!queryParamTaskRun) {
      return null;
    }

    return (
      <div className="bg-card rounded shadow">
        <div className="p-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-medium">{queryParamTaskRun}</h3>
            </div>
          </div>
        </div>
        <hr className="border-border" />
        <div className="px-6 pb-6">
          <Terminal
            content={(logs?.map?.[queryParamTaskRun] || []).join("")}
            height={600}
            enableSearch={true}
            enableDownload={true}
            enableCopy={true}
            showToolbar={true}
            readonly={true}
            downloadFilename={`pipeline-run-logs-${params.name}-${queryParamTaskRun}.log`}
          />
        </div>
      </div>
    );
  }, [logs?.map, params.name, queryParamTaskRun]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-2">
        <div className="flex flex-col">
          <Accordion
            type="single"
            collapsible
            value={queryParamTaskRun || undefined}
            onValueChange={(value) => {
              if (value) {
                handleAccordionChange(value);
              }
            }}
          >
            {logs &&
              logs.order?.map((taskRunName) => {
                const isExpanded = queryParamTaskRun === taskRunName;
                const isActive = queryParamTaskRun === taskRunName;

                return (
                  <AccordionItem
                    key={taskRunName}
                    value={taskRunName}
                    className={cn(
                      "border-0",
                      isExpanded && "border-l-primary border-l-2",
                      !isExpanded && "max-w-[90%]"
                    )}
                  >
                    <AccordionTrigger
                      className={cn(
                        "min-h-0 [&>svg]:h-4 [&>svg]:w-4",
                        isActive && "bg-accent font-medium",
                        !isActive && "font-normal"
                      )}
                    >
                      <span>{taskRunName}</span>
                    </AccordionTrigger>
                  </AccordionItem>
                );
              })}
          </Accordion>
        </div>
      </div>
      <div className="col-span-10">{renderDetails()}</div>
    </div>
  );
};
