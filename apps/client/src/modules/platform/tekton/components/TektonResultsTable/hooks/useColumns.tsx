import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { StatusIcon } from "@/core/components/StatusIcon";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatTimestamp, humanize } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/tekton-result-details/route";
import { PATH_PIPELINE_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipeline-details/route";
import { PATH_COMPONENT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { getTektonResultStatusIcon } from "@/modules/platform/tekton/utils/statusIcons";
import { TektonResult, TektonResultStatus, parseRecordName, tektonResultAnnotations } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { columnNames } from "../constants";
import { ColumnName, UseColumnsOptions } from "../types";

/**
 * Get annotation value from TektonResult, returns undefined if not present or empty
 */
const getAnnotation = (data: TektonResult, key: string): string | undefined => {
  const value = data.annotations?.[key];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return String(value);
};

/**
 * Create a sort function for annotation-based columns
 */
const createAnnotationSortFn = (key: string) => (a: TektonResult, b: TektonResult) => {
  const aVal = getAnnotation(a, key);
  const bVal = getAnnotation(b, key);
  if (!aVal && !bVal) return 0;
  if (!aVal) return 1;
  if (!bVal) return -1;
  return aVal.localeCompare(bVal);
};

/**
 * Hook to get column definitions for TektonResults table
 * Supports hiding specific columns via hiddenColumns option
 */
export const useColumns = (options: UseColumnsOptions): TableColumn<TektonResult>[] => {
  const { hiddenColumns = [], tableId } = options;

  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const { loadSettings } = useTableSettings(tableId);
  const tableSettings = loadSettings();

  const allColumns: TableColumn<TektonResult>[] = React.useMemo(
    () => [
      {
        id: columnNames.STATUS,
        label: "Status",
        data: {
          render: ({ data }) => {
            const status = data.summary?.status || "UNKNOWN";
            const config = getTektonResultStatusIcon(status as TektonResultStatus);

            return <StatusIcon Icon={config.Icon} color={config.color} width={20} Title={config.title} />;
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.STATUS),
        },
      },
      {
        id: columnNames.NAME,
        label: "Name",
        data: {
          columnSortableValuePath: "annotations.object\\.metadata\\.name",
          render: ({ data }) => {
            // Extract actual PipelineRun name from annotations
            const displayName = getAnnotation(data, tektonResultAnnotations.objectMetadataName) ?? data.uid;

            // Parse record name to get resultUid and recordUid for navigation
            const recordInfo = data.summary?.record ? parseRecordName(data.summary.record) : null;

            // If we can't parse the record info, just show text without link
            if (!recordInfo) {
              return <TextWithTooltip text={displayName} />;
            }

            return (
              <Button variant="link" asChild className="w-full justify-start p-0 whitespace-normal">
                <Link
                  to={PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL}
                  params={{
                    clusterName,
                    namespace: defaultNamespace,
                    resultUid: recordInfo.resultUid,
                    recordUid: recordInfo.recordUid,
                  }}
                >
                  <TextWithTooltip text={displayName} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 20,
          ...getSyncedColumnData(tableSettings, columnNames.NAME),
        },
      },
      {
        id: columnNames.PIPELINE,
        label: "Pipeline",
        data: {
          customSortFn: createAnnotationSortFn(tektonResultAnnotations.pipeline),
          render: ({ data }) => {
            const pipelineName = getAnnotation(data, tektonResultAnnotations.pipeline);

            if (!pipelineName) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }

            return (
              <Button variant="link" asChild className="w-full justify-start p-0 whitespace-normal">
                <Link
                  to={PATH_PIPELINE_DETAILS_FULL}
                  params={{
                    clusterName,
                    namespace: defaultNamespace,
                    name: pipelineName,
                  }}
                >
                  <TextWithTooltip text={pipelineName} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 15,
          ...getSyncedColumnData(tableSettings, columnNames.PIPELINE),
        },
      },
      {
        id: columnNames.CODEBASE,
        label: "Codebase",
        data: {
          customSortFn: createAnnotationSortFn(tektonResultAnnotations.codebase),
          render: ({ data }) => {
            const codebaseName = getAnnotation(data, tektonResultAnnotations.codebase);

            if (!codebaseName) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }

            return (
              <Button variant="link" asChild className="w-full justify-start p-0 whitespace-normal">
                <Link
                  to={PATH_COMPONENT_DETAILS_FULL}
                  params={{
                    clusterName,
                    namespace: defaultNamespace,
                    name: codebaseName,
                  }}
                >
                  <TextWithTooltip text={codebaseName} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 14,
          ...getSyncedColumnData(tableSettings, columnNames.CODEBASE),
        },
      },
      {
        id: columnNames.GIT_BRANCH,
        label: "Branch",
        data: {
          customSortFn: createAnnotationSortFn(tektonResultAnnotations.gitBranch),
          render: ({ data }) => {
            const branchName = getAnnotation(data, tektonResultAnnotations.gitBranch) ?? "-";
            return (
              <div className="text-muted-foreground text-sm">
                <TextWithTooltip text={branchName} />
              </div>
            );
          },
        },
        cell: {
          baseWidth: 18,
          ...getSyncedColumnData(tableSettings, columnNames.GIT_BRANCH),
        },
      },
      {
        id: columnNames.GIT_CHANGE_NUMBER,
        label: "PR",
        data: {
          customSortFn: createAnnotationSortFn(tektonResultAnnotations.gitChangeNumber),
          render: ({ data }) => {
            const changeNumber = getAnnotation(data, tektonResultAnnotations.gitChangeNumber);
            const changeUrl = getAnnotation(data, tektonResultAnnotations.gitChangeUrl);

            if (!changeNumber) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }

            if (changeUrl) {
              return (
                <Button variant="link" asChild className="w-full justify-start p-0 whitespace-normal">
                  <a href={changeUrl} target="_blank" rel="noopener noreferrer">
                    <TextWithTooltip text={`#${changeNumber}`} />
                  </a>
                </Button>
              );
            }

            return (
              <div className="text-muted-foreground text-sm">
                <TextWithTooltip text={`#${changeNumber}`} />
              </div>
            );
          },
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, columnNames.GIT_CHANGE_NUMBER),
        },
      },
      {
        id: columnNames.AUTHOR,
        label: "Author",
        data: {
          customSortFn: createAnnotationSortFn(tektonResultAnnotations.gitAuthor),
          render: ({ data }) => {
            const author = getAnnotation(data, tektonResultAnnotations.gitAuthor);
            const avatarUrl = getAnnotation(data, tektonResultAnnotations.gitAvatar);

            if (!author) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }

            return <AuthorAvatar author={author} avatarUrl={avatarUrl} />;
          },
        },
        cell: {
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.AUTHOR),
        },
      },
      {
        id: columnNames.PIPELINE_TYPE,
        label: "Type",
        data: {
          customSortFn: createAnnotationSortFn(tektonResultAnnotations.pipelineType),
          render: ({ data }) => {
            const pipelineType = getAnnotation(data, tektonResultAnnotations.pipelineType) ?? "-";
            return (
              <div className="text-muted-foreground text-sm">
                <TextWithTooltip text={pipelineType} />
              </div>
            );
          },
        },
        cell: {
          baseWidth: 7,
          ...getSyncedColumnData(tableSettings, columnNames.PIPELINE_TYPE),
        },
      },
      {
        id: columnNames.TIME,
        label: "Time",
        data: {
          customSortFn: (a, b) => {
            const aStartTime = a?.summary?.start_time;
            const aEndTime = a?.summary?.end_time;
            const bStartTime = b?.summary?.start_time;
            const bEndTime = b?.summary?.end_time;

            if (!aStartTime || !aEndTime || !bStartTime || !bEndTime) {
              return 0;
            }

            const aDuration = new Date(aEndTime).getTime() - new Date(aStartTime).getTime();
            const bDuration = new Date(bEndTime).getTime() - new Date(bStartTime).getTime();

            return aDuration - bDuration;
          },
          render: ({ data }) => {
            // Use summary.start_time if available, otherwise fallback to create_time
            const startTime = data?.summary?.start_time || data?.create_time;
            const endTime = data?.summary?.end_time;

            // Fallback if no time data at all
            if (!startTime) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }

            const durationTime = endTime
              ? new Date(endTime).getTime() - new Date(startTime).getTime()
              : new Date().getTime() - new Date(startTime).getTime();

            const duration = humanize(durationTime, {
              language: "en-mini",
              spacer: "",
              delimiter: " ",
              fallbacks: ["en"],
              largest: 2,
              round: true,
              units: ["d", "h", "m", "s"],
            });

            const tooltipContent = (
              <div className="flex flex-col gap-1">
                <div>
                  <span className="font-medium">Started at: </span>
                  <span>{formatTimestamp(startTime)}</span>
                </div>
                {endTime && (
                  <div>
                    <span className="font-medium">Finished at: </span>
                    <span>{formatTimestamp(endTime)}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Duration: </span>
                  <span>{duration}</span>
                </div>
              </div>
            );

            return (
              <Tooltip title={tooltipContent}>
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-sm">{duration}</span>
                  <Clock className="text-muted-foreground size-3.5" />
                </div>
              </Tooltip>
            );
          },
        },
        cell: {
          baseWidth: 7,
          ...getSyncedColumnData(tableSettings, columnNames.TIME),
        },
      },
    ],
    [clusterName, defaultNamespace, tableSettings]
  );

  // Filter out hidden columns
  const visibleColumns = React.useMemo(() => {
    if (hiddenColumns.length === 0) {
      return allColumns;
    }

    const hiddenSet = new Set<ColumnName>(hiddenColumns);
    return allColumns.filter((col) => !hiddenSet.has(col.id as ColumnName));
  }, [allColumns, hiddenColumns]);

  return visibleColumns;
};
