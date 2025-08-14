import { humanize } from "@/core/utils/date-humanize";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { Divider, Paper, Stack, Typography } from "@mui/material";
import { getTaskRunStepStatus } from "@my-project/shared";
import { StyledDetailsBody, StyledDetailsHeader } from "../../styles";
import { TaskRunStep } from "./components/TaskRunStep";
import { useTabs } from "./hooks/useTabs";
import { TaskRunStepProps } from "./types";
import { TabsContextProvider } from "@/core/providers/Tabs/provider";

export const TaskRunStepWrapper = ({ pipelineRunTaskData, stepName }: TaskRunStepProps) => {
  const step = pipelineRunTaskData?.taskRun
    ? pipelineRunTaskData.taskRun?.status?.steps?.find((step) => step?.name === stepName)
    : pipelineRunTaskData?.task?.spec?.steps?.find((step) => step?.name === stepName);

  const taskRunStepStatus = getTaskRunStepStatus(step);

  const completionTime = taskRunStepStatus.finishedAt;
  const startTime = taskRunStepStatus.startedAt;

  const duration =
    startTime && completionTime
      ? humanize(new Date(completionTime).getTime() - new Date(startTime).getTime(), {
          language: "en-mini",
          spacer: "",
          delimiter: " ",
          fallbacks: ["en"],
          largest: 2,
          round: true,
          units: ["d", "h", "m", "s"],
        })
      : null;

  const tabs = useTabs({
    taskRun: pipelineRunTaskData?.taskRun,
    stepName: step?.name || "",
    task: pipelineRunTaskData?.task,
  });

  const taskDescription = pipelineRunTaskData?.task?.spec?.description || "";

  return (
    <Paper>
      <StyledDetailsHeader>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography fontSize={(t) => t.typography.pxToRem(20)} fontWeight={500}>
              {step?.name}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Typography fontSize={(t) => t.typography.pxToRem(14)} fontWeight={500} color="primary.dark">
              Status:{" "}
              <Typography fontSize={(t) => t.typography.pxToRem(14)} component="span" color="secondary.dark">
                {capitalizeFirstLetter(taskRunStepStatus.reason || taskRunStepStatus.status || "unknown")}
              </Typography>
            </Typography>
            <Typography fontSize={(t) => t.typography.pxToRem(14)} fontWeight={500} color="primary.dark">
              Duration:{" "}
              <Typography fontSize={(t) => t.typography.pxToRem(14)} component="span" color="secondary.dark">
                {step && Object.hasOwn(step, "terminated") ? duration || "Not started" : "In progress"}
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
        <TabsContextProvider id="pipeline-details-page-inner-taskrun-step">
          <TaskRunStep tabs={tabs} />
        </TabsContextProvider>
      </StyledDetailsBody>
    </Paper>
  );
};
