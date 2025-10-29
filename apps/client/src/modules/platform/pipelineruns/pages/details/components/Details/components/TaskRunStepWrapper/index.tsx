import { humanize } from "@/core/utils/date-humanize";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { Divider, Paper } from "@mui/material";
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-medium">
              {step?.name}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              Status:{" "}
              <span className="text-sm text-muted-foreground">
                {capitalizeFirstLetter(taskRunStepStatus.reason || taskRunStepStatus.status || "unknown")}
              </span>
            </span>
            <span className="text-sm font-medium text-foreground">
              Duration:{" "}
              <span className="text-sm text-muted-foreground">
                {step && Object.hasOwn(step, "terminated") ? duration || "Not started" : "In progress"}
              </span>
            </span>
          </div>
          {taskDescription && (
            <span className="text-sm font-medium text-foreground">
              Description:{" "}
              <span className="text-sm text-muted-foreground">
                {taskDescription}
              </span>
            </span>
          )}
        </div>
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
