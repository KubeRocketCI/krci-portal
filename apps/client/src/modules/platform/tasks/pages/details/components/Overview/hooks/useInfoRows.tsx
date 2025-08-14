import { InfoRow } from "@/core/components/InfoColumns/types";
import { Chip, Grid } from "@mui/material";
import { Task } from "@my-project/shared";
import React from "react";

export const useInfoRows = (task: Task): InfoRow[] => {
  return React.useMemo(() => {
    const pipelineLabels = Object.entries(task.metadata?.labels || {}).map(([key, value]) => `${key}:${value}`);

    return [
      [
        {
          label: "Created At",
          text: new Date(task.metadata.creationTimestamp).toLocaleString("en-mini", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          }),
        },
        {
          label: "Labels",
          text: (
            <Grid container spacing={1} flexWrap="wrap">
              {pipelineLabels.map((el) => (
                <Grid item key={el}>
                  <Chip label={el} size="small" />
                </Grid>
              ))}
            </Grid>
          ),
          columnXs: 10,
        },
      ],
    ];
  }, [task]);
};
