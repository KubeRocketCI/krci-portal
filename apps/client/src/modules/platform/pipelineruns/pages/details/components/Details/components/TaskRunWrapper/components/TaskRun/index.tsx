import { Divider, Paper, Stack, Typography } from "@mui/material";
import { useTabs } from "./hooks/useTabs";
import { TaskRunProps } from "./types";
import { getTaskRunStatus, taskRunLabels } from "@my-project/shared";
import { humanize } from "@/core/utils/date-humanize";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { StyledDetailsBody, StyledDetailsHeader } from "../../../../styles";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";

export const TaskRun = ({ pipelineRunTaskData }: TaskRunProps) => {
  const { taskRun, task } = pipelineRunTaskData;
  const taskRunName = taskRun?.metadata?.labels?.[taskRunLabels.pipelineTask];
  const taskRunStatus = getTaskRunStatus(taskRun);

  const completionTime = taskRun?.status?.completionTime || "";
  const startTime = taskRun?.status?.startTime || "";

  const duration = humanize(new Date(completionTime).getTime() - new Date(startTime).getTime(), {
    language: "en-mini",
    spacer: "",
    delimiter: " ",
    fallbacks: ["en"],
    largest: 2,
    round: true,
    units: ["d", "h", "m", "s"],
  });

  const tabs = useTabs({ taskRun, task });

  const taskDescription = pipelineRunTaskData.task?.spec?.description || "";

  const { activeTab, handleChangeTab } = useTabsContext();

  return (
    <Paper>
      <StyledDetailsHeader>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography fontSize={(t) => t.typography.pxToRem(20)} fontWeight={500}>
              {taskRunName}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Typography fontSize={(t) => t.typography.pxToRem(14)} fontWeight={500} color="primary.dark">
              Status:{" "}
              <Typography fontSize={(t) => t.typography.pxToRem(14)} component="span" color="secondary.dark">
                {taskRunStatus.reason}
              </Typography>
            </Typography>
            <Typography fontSize={(t) => t.typography.pxToRem(14)} fontWeight={500} color="primary.dark">
              Duration:{" "}
              <Typography fontSize={(t) => t.typography.pxToRem(14)} component="span" color="secondary.dark">
                {duration}
              </Typography>
            </Typography>
          </Stack>
          {taskDescription && (
            <Typography fontSize={(t) => t.typography.pxToRem(14)} fontWeight={500} color="primary.dark">
              Description:{" "}
              <Typography fontSize={(t) => t.typography.pxToRem(14)} component="span" color="secondary.dark">
                {taskDescription}
              </Typography>
            </Typography>
          )}
        </Stack>
      </StyledDetailsHeader>
      <Divider orientation="horizontal" />
      <StyledDetailsBody>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </StyledDetailsBody>
    </Paper>
  );
};
