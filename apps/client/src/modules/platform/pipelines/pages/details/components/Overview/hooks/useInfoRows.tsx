import { InfoRow } from "@/core/components/InfoColumns/types";
import { Chip, Grid, Typography } from "@mui/material";
import React from "react";
import { usePipelineWatch } from "../../../hooks/data";

export const useInfoRows = (): InfoRow[] => {
  const pipelineWatch = usePipelineWatch();
  const pipeline = pipelineWatch.query.data;

  return React.useMemo(() => {
    if (pipelineWatch.query.isLoading || !pipeline) {
      return [];
    }

    const pipelineLabels = Object.entries(pipeline?.metadata?.labels || {}).map(([key, value]) => `${key}:${value}`);

    const createdAt = pipeline.metadata?.creationTimestamp
      ? new Date(pipeline.metadata.creationTimestamp).toLocaleString("en-mini", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        })
      : "Unknown";

    return [
      [
        {
          label: "Name",
          text: pipeline.metadata?.name || "Unknown",
        },
        {
          label: "Namespace",
          text: pipeline.metadata?.namespace || "Unknown",
        },
        {
          label: "Created at",
          text: createdAt,
        },
      ],
      [
        {
          label: "Description",
          text: pipeline.spec?.description || pipeline.spec?.displayName || "No description available",
          columnXs: 12,
        },
      ],
      [
        {
          label: "Labels",
          text:
            pipelineLabels.length > 0 ? (
              <Grid container spacing={1} flexWrap="wrap">
                {pipelineLabels.map((el) => (
                  <Grid item key={el}>
                    <Chip label={el} size="small" />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography fontSize={13} color="text.secondary">
                No labels
              </Typography>
            ),
          columnXs: 12,
        },
      ],
    ];
  }, [pipeline, pipelineWatch.query.isLoading]);
};
