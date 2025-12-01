import { Badge } from "@/core/components/ui/badge";
import { Task } from "@my-project/shared";
import React from "react";

export interface GridItem {
  label: string;
  content: React.ReactNode;
  colSpan?: number;
}

export const useInfoRows = (task: Task): GridItem[] => {
  return React.useMemo(() => {
    const pipelineLabels = Object.entries(task.metadata?.labels || {}).map(([key, value]) => `${key}:${value}`);

    return [
      {
        label: "Created At",
        content: (
          <span className="text-foreground text-sm">
            {new Date(task.metadata.creationTimestamp).toLocaleString("en-mini", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </span>
        ),
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
        colSpan: 3,
      },
    ];
  }, [task]);
};
