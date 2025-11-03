import { Accordion, Divider, Paper, useTheme } from "@mui/material";
import React from "react";
import { Terminal } from "@/core/components/Terminal";
import { StyledAccordionSummary } from "../../../../styles";
import { StyledDetailsBody, StyledDetailsHeader } from "../../../Details/styles";
import { routePipelineRunDetails, PATH_PIPELINERUN_DETAILS_FULL } from "../../../../route";
import { usePipelineRunLogsQueryWithPageParams } from "../../../../hooks/data";
import { router } from "@/core/router";

export const LogsByTask = () => {
  const params = routePipelineRunDetails.useParams();
  const search = routePipelineRunDetails.useSearch();

  const queryParamTaskRun = search.taskRun;

  const logsQuery = usePipelineRunLogsQueryWithPageParams();
  const logs = logsQuery.data;

  const handleAccordionChange = (taskRun: string) => () => {
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

  const theme = useTheme();

  const renderDetails = React.useCallback(() => {
    if (!queryParamTaskRun) {
      return null;
    }

    return (
      <Paper>
        <StyledDetailsHeader>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-medium">{queryParamTaskRun}</h3>
            </div>
          </div>
        </StyledDetailsHeader>
        <Divider orientation="horizontal" />
        <StyledDetailsBody>
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
        </StyledDetailsBody>
      </Paper>
    );
  }, [logs?.map, params.name, queryParamTaskRun]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-2">
        <div className="flex flex-col">
          {logs &&
            logs.order?.map((taskRunName) => {
              const isExpanded = queryParamTaskRun === taskRunName;
              const isActive = queryParamTaskRun === taskRunName;

              return (
                <Accordion
                  key={taskRunName}
                  expanded={isExpanded}
                  onChange={handleAccordionChange(taskRunName)}
                  sx={{
                    borderLeft: isExpanded ? `2px solid ${theme.palette.primary.main}` : null,
                    maxWidth: isExpanded ? "100%" : "90%",

                    "&.Mui-expanded": {
                      margin: 0,

                      "&::before": {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <StyledAccordionSummary isActive={isActive} disableRipple={false} disableTouchRipple={false}>
                    <span>{taskRunName}</span>
                  </StyledAccordionSummary>
                </Accordion>
              );
            })}
        </div>
      </div>
      <div className="col-span-10">{renderDetails()}</div>
    </div>
  );
};
