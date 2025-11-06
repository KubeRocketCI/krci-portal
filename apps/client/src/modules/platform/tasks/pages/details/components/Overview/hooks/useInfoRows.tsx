import { InfoRow } from "@/core/components/InfoColumns/types";
import { Badge } from "@/core/components/ui/badge";
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
            <div className="flex flex-wrap gap-2">
              {pipelineLabels.map((el) => (
                <div key={el}>
                  <Badge variant="secondary">{el}</Badge>
                </div>
              ))}
            </div>
          ),
          columnXs: 10,
        },
      ],
    ];
  }, [task]);
};
