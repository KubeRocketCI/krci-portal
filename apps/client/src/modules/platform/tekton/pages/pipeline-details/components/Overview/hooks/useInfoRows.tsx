import { Badge } from "@/core/components/ui/badge";
import React from "react";
import { usePipelineWatch } from "../../../hooks/data";

export interface GridItem {
  label: string;
  content: React.ReactNode;
  colSpan?: number;
}

export const useInfoRows = (): GridItem[] => {
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
      {
        label: "Name",
        content: <span className="text-foreground text-sm">{pipeline.metadata?.name || "Unknown"}</span>,
      },
      {
        label: "Namespace",
        content: <span className="text-foreground text-sm">{pipeline.metadata?.namespace || "Unknown"}</span>,
      },
      {
        label: "Created at",
        content: <span className="text-foreground text-sm">{createdAt}</span>,
      },
      {
        label: "Description",
        content: (
          <span className="text-foreground text-sm">
            {pipeline.spec?.description || pipeline.spec?.displayName || "No description available"}
          </span>
        ),
        colSpan: 4,
      },
      {
        label: "Labels",
        content: (
          <div className="flex flex-wrap gap-2">
            {pipelineLabels.length > 0 ? (
              pipelineLabels.map((el) => (
                <Badge key={el} variant="secondary">
                  {el}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No labels</span>
            )}
          </div>
        ),
        colSpan: 4,
      },
    ];
  }, [pipeline, pipelineWatch.query.isLoading]);
};
