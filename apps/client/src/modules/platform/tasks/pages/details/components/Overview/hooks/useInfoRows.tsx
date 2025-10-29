import { InfoRow } from "@/core/components/InfoColumns/types";
import { Chip } from "@mui/material";
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
                  <Chip label={el} size="small" />
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
