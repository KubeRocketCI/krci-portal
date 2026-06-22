import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useClusterStore } from "@/k8s/store";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { formatTimestamp, formatUnixTimestamp } from "@/core/utils/date-humanize";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { PATH_PROJECT_DETAILS_FULL, routeSearchTabName } from "@/modules/platform/codebases/pages/details/route";
import { GitLabCIPipelineLogsDialog } from "@/modules/platform/gitlabci/dialogs/PipelineLogs";
import { Link } from "@tanstack/react-router";
import { ExternalLink, GitBranch, GitCommitHorizontal, ScrollText } from "lucide-react";
import React from "react";
import { gitlabCIPipelineColumnNames } from "../../../constants";
import type { GitLabCIPipelineRow } from "../../../hooks/useGitLabCIPipelines";
import { GitLabCIPipelineStatus } from "../../PipelineStatus";

export function useColumns({
  showCodebaseColumn = true,
}: {
  showCodebaseColumn?: boolean;
}): TableColumn<GitLabCIPipelineRow>[] {
  const clusterName = useClusterStore((state) => state.clusterName);

  const openLogsDialog = useDialogOpener(GitLabCIPipelineLogsDialog);

  return React.useMemo(() => {
    const openLogs = (row: GitLabCIPipelineRow) =>
      openLogsDialog({
        gitServer: row.gitServer,
        project: row.project,
        pipelineId: row.id,
        pipelineStatus: row.status,
        codebaseName: row.codebaseName,
        ref: row.ref,
        webUrl: row.web_url,
      });

    const columns: TableColumn<GitLabCIPipelineRow>[] = [
      {
        id: gitlabCIPipelineColumnNames.PIPELINE,
        label: "Pipeline",
        data: {
          // Pipeline ids are numeric strings; sort them numerically so #10 ranks after #9
          // (the shared columnSortableValuePath sort is lexicographic, which would mis-order them).
          customSortFn: (a, b) => Number(a.id) - Number(b.id),
          render: ({ data }) => (
            <Tooltip title="View pipeline logs" delayDuration={500}>
              <Button
                variant="link"
                className="w-full justify-start gap-1 p-0 whitespace-normal"
                onClick={() => openLogs(data)}
              >
                <ENTITY_ICON.pipelineRun className="text-muted-foreground/70 size-4 shrink-0" />
                <span className="truncate">#{data.id}</span>
              </Button>
            </Tooltip>
          ),
        },
        cell: { baseWidth: 12 },
      },
      {
        id: gitlabCIPipelineColumnNames.STATUS,
        label: "Status",
        data: {
          columnSortableValuePath: "status",
          render: ({ data }) => <GitLabCIPipelineStatus status={data.status} />,
        },
        cell: { baseWidth: 12 },
      },
      ...(showCodebaseColumn
        ? [
            {
              id: gitlabCIPipelineColumnNames.CODEBASE,
              label: "Project",
              data: {
                columnSortableValuePath: "codebaseName",
                render: ({ data }) => (
                  <Button variant="link" asChild className="w-full justify-start p-0 whitespace-normal">
                    <Link
                      to={PATH_PROJECT_DETAILS_FULL}
                      params={{ name: data.codebaseName, namespace: data.namespace, clusterName }}
                      search={{ tab: routeSearchTabName.pipelines }}
                    >
                      <ENTITY_ICON.project className="text-muted-foreground/70" />
                      <TextWithTooltip text={data.codebaseName} />
                    </Link>
                  </Button>
                ),
              },
              cell: { baseWidth: 14 },
            } satisfies TableColumn<GitLabCIPipelineRow>,
          ]
        : []),
      {
        id: gitlabCIPipelineColumnNames.REF,
        label: "Ref",
        data: {
          columnSortableValuePath: "ref",
          render: ({ data }) =>
            data.ref ? (
              <div className="text-muted-foreground flex items-center gap-1 overflow-hidden text-sm">
                <GitBranch className="size-3.5 shrink-0" />
                <TextWithTooltip text={data.ref} />
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            ),
        },
        cell: { baseWidth: 14 },
      },
      {
        id: gitlabCIPipelineColumnNames.COMMIT,
        label: "Commit",
        data: {
          render: ({ data }) =>
            data.sha ? (
              <Tooltip title={data.sha} delayDuration={500}>
                <span className="text-muted-foreground inline-flex items-center gap-1 font-mono text-xs">
                  <GitCommitHorizontal className="size-3.5" />
                  {data.sha.slice(0, 7)}
                </span>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            ),
        },
        cell: { baseWidth: 10 },
      },
      {
        id: gitlabCIPipelineColumnNames.SOURCE,
        label: "Source",
        data: {
          columnSortableValuePath: "source",
          render: ({ data }) =>
            data.source ? (
              <div className="text-muted-foreground text-sm">
                <TextWithTooltip text={data.source} />
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            ),
        },
        cell: { baseWidth: 12 },
      },
      {
        id: gitlabCIPipelineColumnNames.CREATED,
        label: "Created",
        data: {
          columnSortableValuePath: "created_at",
          render: ({ data }) =>
            data.created_at ? (
              <Tooltip title={formatUnixTimestamp(data.created_at)} delayDuration={500}>
                <span className="text-sm whitespace-nowrap">{formatTimestamp(data.created_at)}</span>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            ),
        },
        cell: { baseWidth: 12 },
      },
      {
        id: gitlabCIPipelineColumnNames.ACTIONS,
        label: "Actions",
        data: {
          render: ({ data }) => (
            <div className="flex items-center gap-1">
              <Tooltip title="View logs" delayDuration={500}>
                <Button variant="ghost" size="icon" aria-label="View pipeline logs" onClick={() => openLogs(data)}>
                  <ScrollText size={16} />
                </Button>
              </Tooltip>
              <Tooltip title="Open in GitLab" delayDuration={500}>
                <Button variant="ghost" size="icon" aria-label="Open pipeline in GitLab" asChild>
                  <a href={data.web_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} />
                  </a>
                </Button>
              </Tooltip>
            </div>
          ),
        },
        cell: { isFixed: true, baseWidth: 9 },
      },
    ];

    return columns;
  }, [showCodebaseColumn, clusterName, openLogsDialog]);
}
