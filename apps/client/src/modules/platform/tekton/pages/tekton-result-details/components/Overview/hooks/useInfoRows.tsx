import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { Badge } from "@/core/components/ui/badge";
import React from "react";
import { useTektonResultPipelineRunQuery } from "../../../hooks/data";
import { formatTimestamp, formatDuration } from "@/core/utils/date-humanize";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getPipelineRunConditionStatusIcon } from "@/modules/platform/tekton/utils/statusIcons";
import { pipelineRunLabels, tektonResultAnnotations } from "@my-project/shared";

export interface GridItem {
  label: string;
  content: React.ReactNode;
  colSpan?: number;
}

export const useInfoRows = (): GridItem[] => {
  const pipelineRunQuery = useTektonResultPipelineRunQuery();
  const pipelineRun = pipelineRunQuery.data?.pipelineRun;

  return React.useMemo(() => {
    if (pipelineRunQuery.isLoading || !pipelineRun) {
      return [];
    }

    const condition = pipelineRun.status?.conditions?.[0];
    const statusConfig = getPipelineRunConditionStatusIcon(condition);

    const labels = Object.entries(pipelineRun.metadata?.labels || {}).map(
      ([key, value]) => `${key}:${value}`
    );

    const startTime = pipelineRun.status?.startTime;
    const completionTime = pipelineRun.status?.completionTime;
    const lastTransitionTime = condition?.lastTransitionTime;

    const startedAt = formatTimestamp(startTime);
    const duration = formatDuration(startTime, completionTime);
    const updatedLast = formatDuration(lastTransitionTime);

    // Get pipeline name from labels or pipelineRef
    const pipelineName =
      pipelineRun.metadata?.labels?.[pipelineRunLabels.pipeline] ||
      pipelineRun.spec?.pipelineRef?.name ||
      "N/A";

    // Get codebase info from EDP labels
    const codebase = pipelineRun.metadata?.labels?.[pipelineRunLabels.codebase] || "";
    const codebaseBranch = pipelineRun.metadata?.labels?.[pipelineRunLabels.codebaseBranch] || "";
    const pipelineType = pipelineRun.metadata?.labels?.[pipelineRunLabels.pipelineType] || "";

    // Get git info from annotations
    const annotations = pipelineRun.metadata?.annotations;
    const gitAuthor = annotations?.[tektonResultAnnotations.gitAuthor];
    const gitAvatar = annotations?.[tektonResultAnnotations.gitAvatar];
    const gitChangeNumber = annotations?.[tektonResultAnnotations.gitChangeNumber];
    const gitChangeUrl = annotations?.[tektonResultAnnotations.gitChangeUrl];

    return [
      {
        label: "Status",
        content: (
          <div className="flex items-center gap-1.5">
            <StatusIcon
              Icon={statusConfig.Icon}
              isSpinning={statusConfig.isSpinning}
              color={statusConfig.color}
              width={14}
            />
            <span className="text-foreground text-sm">
              {condition?.status === "True" ? "True" : condition?.status === "False" ? "False" : "Unknown"}
              {condition?.reason && `, ${condition.reason}`}
            </span>
          </div>
        ),
      },
      {
        label: "Pipeline",
        content: <span className="text-foreground text-sm">{pipelineName}</span>,
      },
      {
        label: "Started at",
        content: <span className="text-foreground text-sm">{startedAt}</span>,
      },
      {
        label: "Duration",
        content: <span className="text-foreground text-sm">{duration}</span>,
      },
      {
        label: "Last updated",
        content: <span className="text-foreground text-sm">{updatedLast}</span>,
      },
      ...(pipelineType
        ? [
            {
              label: "Pipeline Type",
              content: (
                <Badge variant="secondary" className="capitalize">
                  {pipelineType}
                </Badge>
              ),
            },
          ]
        : []),
      ...(codebase
        ? [
            {
              label: "Codebase",
              content: <span className="text-foreground text-sm">{codebase}</span>,
            },
          ]
        : []),
      ...(codebaseBranch
        ? [
            {
              label: "Branch",
              content: <span className="text-foreground text-sm">{codebaseBranch}</span>,
            },
          ]
        : []),
      ...(gitAuthor
        ? [
            {
              label: "Author",
              content: <AuthorAvatar author={gitAuthor} avatarUrl={gitAvatar} size="md" />,
            },
          ]
        : []),
      ...(gitChangeNumber
        ? [
            {
              label: "Pull Request",
              content: gitChangeUrl ? (
                <a
                  href={gitChangeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  #{gitChangeNumber}
                </a>
              ) : (
                <span className="text-foreground text-sm">#{gitChangeNumber}</span>
              ),
            },
          ]
        : []),
      {
        label: "Message",
        content: (
          <span className="text-foreground text-sm">
            {condition?.message || "No message"}
          </span>
        ),
        colSpan: 4,
      },
      {
        label: "Labels",
        content: (
          <div className="flex flex-wrap gap-2">
            {labels.length > 0 ? (
              labels.map((el) => (
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
  }, [pipelineRun, pipelineRunQuery.isLoading]);
};
