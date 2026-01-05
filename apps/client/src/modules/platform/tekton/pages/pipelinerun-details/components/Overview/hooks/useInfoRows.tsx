import { Badge } from "@/core/components/ui/badge";
import React from "react";
import { usePipelineRunWatchWithPageParams } from "../../../hooks/data";
import { humanize } from "@/core/utils/date-humanize";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { getPipelineRunStatus } from "@my-project/shared";
import { StatusIcon } from "@/core/components/StatusIcon";

export interface GridItem {
  label: string;
  content: React.ReactNode;
  colSpan?: number;
}

export const useInfoRows = (): GridItem[] => {
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
      {
        label: "Status",
        content: (
          <div className="flex items-center gap-1.5">
            <StatusIcon
              Icon={pipelineRunStatusIcon.component}
              isSpinning={pipelineRunStatusIcon.isSpinning}
              color={pipelineRunStatusIcon.color}
              width={14}
            />
            <span className="text-foreground text-sm">{`${pipelineRunStatus.status}, ${pipelineRunStatus.reason}`}</span>
          </div>
        ),
      },
      {
        label: "Started at",
        content: <span className="text-foreground text-sm">{startedAt}</span>,
      },
      {
        label: "Duration",
        content: <span className="text-foreground text-sm">{activeDuration}</span>,
      },
      {
        label: "Last updated",
        content: <span className="text-foreground text-sm">{updatedLast}</span>,
      },
      {
        label: "Message",
        content: <span className="text-foreground text-sm">{pipelineRunStatus.message}</span>,
        colSpan: 4,
      },
      {
        label: "Labels",
        content: (
          <div className="flex flex-wrap gap-2">
            {pipelineRunLabels.length > 0 ? (
              pipelineRunLabels.map((el) => (
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
  }, [pipelineRun, pipelineRunWatch.isLoading]);
};
