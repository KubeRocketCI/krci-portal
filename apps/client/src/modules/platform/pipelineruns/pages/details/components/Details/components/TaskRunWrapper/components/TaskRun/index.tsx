import { Divider, Paper } from "@mui/material";
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-medium">
              {taskRunName}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              Status:{" "}
              <span className="text-sm text-muted-foreground">
                {taskRunStatus.reason}
              </span>
            </span>
            <span className="text-sm font-medium text-foreground">
              Duration:{" "}
              <span className="text-sm text-muted-foreground">
                {duration}
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
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </StyledDetailsBody>
    </Paper>
  );
};
