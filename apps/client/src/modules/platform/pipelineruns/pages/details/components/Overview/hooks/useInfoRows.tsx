import { InfoRow } from "@/core/components/InfoColumns/types";
import { Chip, Grid, Stack, Typography } from "@mui/material";
import React from "react";
import { usePipelineRunWatchWithPageParams } from "../../../hooks/data";
import { humanize } from "@/core/utils/date-humanize";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { getPipelineRunStatus } from "@my-project/shared";
import { StatusIcon } from "@/core/components/StatusIcon";

export const useInfoRows = (): InfoRow[] => {
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const pipelineRun = pipelineRunWatch.query.data;

  return React.useMemo(() => {
    if (pipelineRunWatch.isLoading) {
      return [];
    }

    const pipelineRunStatus = getPipelineRunStatus(pipelineRun);
    const pipelineRunStatusIcon = getPipelineRunStatusIcon(pipelineRun);

    const pipelineRunLabels = Object.entries(pipelineRun?.metadata?.labels || {}).map(
      ([key, value]) => `${key}:${value}`
    );

    const startedAt = new Date(pipelineRunStatus.startTime).toLocaleString("en-mini", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });

    const updatedLast = humanize(new Date(pipelineRunStatus.lastTransitionTime).getTime() - new Date().getTime(), {
      language: "en-mini",
      spacer: "",
      delimiter: " ",
      fallbacks: ["en"],
      largest: 2,
      round: true,
      units: ["d", "h", "m", "s"],
    });

    const activeDuration = humanize(
      pipelineRunStatus.completionTime
        ? new Date(pipelineRunStatus.completionTime).getTime() - new Date(pipelineRunStatus.startTime).getTime()
        : new Date().getTime() - new Date(pipelineRunStatus.startTime).getTime(),
      {
        language: "en-mini",
        spacer: "",
        delimiter: " ",
        fallbacks: ["en"],
        largest: 2,
        round: true,
        units: ["d", "h", "m", "s"],
      }
    );

    return [
      [
        {
          label: "Status",
          text: (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <StatusIcon
                Icon={pipelineRunStatusIcon.component}
                isSpinning={pipelineRunStatusIcon.isSpinning}
                color={pipelineRunStatusIcon.color}
              />
              <Typography fontSize={13}>{`${pipelineRunStatus.status}, ${pipelineRunStatus.reason}`}</Typography>
            </Stack>
          ),
        },

        {
          label: "Started at",
          text: startedAt,
        },
        {
          label: "Duration",
          text: activeDuration,
        },
        {
          label: "Last updated",
          text: updatedLast,
        },
      ],
      [
        {
          label: "Message",
          text: pipelineRunStatus.message,
          columnXs: 12,
        },
      ],
      [
        {
          label: "Labels",
          text: (
            <Grid container spacing={1} flexWrap="wrap">
              {pipelineRunLabels.map((el) => (
                <Grid item key={el}>
                  <Chip label={el} size="small" />
                </Grid>
              ))}
            </Grid>
          ),
          columnXs: 12,
        },
      ],
    ];
  }, [pipelineRun, pipelineRunWatch.isLoading]);
};
