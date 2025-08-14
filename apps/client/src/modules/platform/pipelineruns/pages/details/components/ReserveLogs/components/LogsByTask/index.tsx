import { Accordion, Divider, Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import React from "react";
import { Terminal } from "@/core/components/Terminal";
import { StyledAccordionSummary } from "../../../../styles";
import { StyledDetailsBody, StyledDetailsHeader } from "../../../Details/styles";
import { routePipelineRunDetails } from "../../../../route";
import { usePipelineRunLogsQueryWithPageParams } from "../../../../hooks/data";
import { router } from "@/core/router";

export const LogsByTask = () => {
  const params = routePipelineRunDetails.useParams();
  const search = routePipelineRunDetails.useSearch();

  const queryParamTaskRun = search.taskRun;

  const logsQuery = usePipelineRunLogsQueryWithPageParams();
  const logs = logsQuery.data;

  const initialTaskRunName = logs?.order?.[0];

  const handleAccordionChange = (taskRun: string) => () => {
    router.navigate({
      to: routePipelineRunDetails.to,
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
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography fontSize={(t) => t.typography.pxToRem(20)} fontWeight={500}>
                {queryParamTaskRun}
              </Typography>
            </Stack>
          </Stack>
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
    <Grid container rowSpacing={3}>
      <Grid item xs={2}>
        <Stack>
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
                    <Typography>{taskRunName}</Typography>
                  </StyledAccordionSummary>
                </Accordion>
              );
            })}
        </Stack>
      </Grid>
      <Grid item xs={10}>
        {renderDetails()}
      </Grid>
    </Grid>
  );
};
