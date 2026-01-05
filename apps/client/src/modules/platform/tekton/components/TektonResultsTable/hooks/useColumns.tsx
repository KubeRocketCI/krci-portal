import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { StatusIcon } from "@/core/components/StatusIcon";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Button } from "@/core/components/ui/button";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/tekton-result-details/route";
import { getTektonResultStatusIcon } from "@/modules/platform/tekton/utils/statusIcons";
import { TektonResult, TektonResultStatus, parseRecordName, tektonResultAnnotations } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
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
          baseWidth: 3,
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
              <Button variant="link" asChild className="p-0">
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
          baseWidth: 25,
          ...getSyncedColumnData(tableSettings, columnNames.NAME),
        },
      },
      {
        id: columnNames.PIPELINE,
        label: "Pipeline",
        data: {
          customSortFn: createAnnotationSortFn(tektonResultAnnotations.pipeline),
          render: ({ data }) => {
            return <span className="text-muted-foreground text-sm">{getAnnotation(data, tektonResultAnnotations.pipeline) ?? "-"}</span>;
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
            return <span className="text-muted-foreground text-sm">{getAnnotation(data, tektonResultAnnotations.codebase) ?? "-"}</span>;
          },
        },
        cell: {
          baseWidth: 13,
          ...getSyncedColumnData(tableSettings, columnNames.CODEBASE),
        },
      },
      {
        id: columnNames.GIT_BRANCH,
        label: "Branch",
        data: {
          customSortFn: createAnnotationSortFn(tektonResultAnnotations.gitBranch),
          render: ({ data }) => {
            return <span className="text-muted-foreground text-sm">{getAnnotation(data, tektonResultAnnotations.gitBranch) ?? "-"}</span>;
          },
        },
        cell: {
          baseWidth: 9,
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
                <a
                  href={changeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  #{changeNumber}
                </a>
              );
            }

            return <span className="text-muted-foreground text-sm">#{changeNumber}</span>;
          },
        },
        cell: {
          baseWidth: 5,
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
            return <span className="text-muted-foreground text-sm">{getAnnotation(data, tektonResultAnnotations.pipelineType) ?? "-"}</span>;
          },
        },
        cell: {
          baseWidth: 6,
          ...getSyncedColumnData(tableSettings, columnNames.PIPELINE_TYPE),
        },
      },
      {
        id: columnNames.CREATED,
        label: "Created",
        data: {
          customSortFn: (a, b) => {
            const aTime = a.create_time;
            const bTime = b.create_time;

            if (!aTime || !bTime) return 0;

            return new Date(aTime).getTime() - new Date(bTime).getTime();
          },
          render: ({ data }) => {
            return <span className="text-sm">{formatTimestamp(data.create_time)}</span>;
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.CREATED),
        },
      },
      {
        id: columnNames.ENDED,
        label: "Ended",
        data: {
          customSortFn: (a, b) => {
            const aTime = a.summary?.end_time;
            const bTime = b.summary?.end_time;

            if (!aTime || !bTime) return 0;

            return new Date(aTime).getTime() - new Date(bTime).getTime();
          },
          render: ({ data }) => {
            return <span className="text-sm">{formatTimestamp(data.summary?.end_time)}</span>;
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.ENDED),
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
