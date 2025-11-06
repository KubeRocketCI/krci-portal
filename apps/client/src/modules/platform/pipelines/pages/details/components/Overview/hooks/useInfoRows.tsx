import { InfoRow } from "@/core/components/InfoColumns/types";
import { Badge } from "@/core/components/ui/badge";
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
              <div className="flex flex-wrap gap-2">
                {pipelineLabels.map((el) => (
                  <div key={el}>
                    <Badge variant="secondary">{el}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">No labels</span>
            ),
          columnXs: 12,
        },
      ],
    ];
  }, [pipeline, pipelineWatch.query.isLoading]);
};
