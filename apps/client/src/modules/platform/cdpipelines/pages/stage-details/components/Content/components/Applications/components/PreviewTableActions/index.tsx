import { usePipelineRunsWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { getPipelineRunStatus, pipelineRunReason } from "@my-project/shared";
import React from "react";
import { CleanButton } from "./components/CleanButton";
import { ConfigureDeployButton } from "./components/ConfigureDeployButton";
import { PreviewTableActionsProps } from "./types";

export const PreviewTableActions = ({ toggleMode }: PreviewTableActionsProps) => {
  const pipelineRunsWatch = usePipelineRunsWatch();

  const latestCleanPipelineRunIsRunning = React.useMemo(() => {
    const latestNewCleanPipelineRun = pipelineRunsWatch.data?.clean?.[0];

    if (!latestNewCleanPipelineRun) {
      return false;
    }

    const status = getPipelineRunStatus(latestNewCleanPipelineRun);

    const isRunning = status.reason === pipelineRunReason.running;

    return !latestNewCleanPipelineRun?.status || isRunning;
  }, [pipelineRunsWatch.data?.clean]);

  const latestDeployPipelineRunIsRunning = React.useMemo(() => {
    const latestNewDeployPipelineRun = pipelineRunsWatch.data?.deploy?.[0];

    if (!latestNewDeployPipelineRun) {
      return false;
    }

    const status = getPipelineRunStatus(latestNewDeployPipelineRun);

    const isRunning = status.reason === pipelineRunReason.running;

    return !latestNewDeployPipelineRun?.status || isRunning;
  }, [pipelineRunsWatch.data?.deploy]);

  return (
    <div className="flex flex-row items-center justify-end gap-4">
      <CleanButton
        latestCleanPipelineRunIsRunning={latestCleanPipelineRunIsRunning}
        latestDeployPipelineRunIsRunning={latestDeployPipelineRunIsRunning}
      />
      <ConfigureDeployButton
        latestCleanPipelineRunIsRunning={latestCleanPipelineRunIsRunning}
        latestDeployPipelineRunIsRunning={latestDeployPipelineRunIsRunning}
        toggleMode={toggleMode}
      />
    </div>
  );
};
