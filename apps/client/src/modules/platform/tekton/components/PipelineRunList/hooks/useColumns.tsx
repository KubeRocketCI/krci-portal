import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { SavedTableSettings } from "@/core/components/Table/components/TableSettings/types";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useClusterStore } from "@/k8s/store";
import { formatTimestamp, formatUnixTimestamp, formatDuration } from "@/core/utils/date-humanize";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { PipelineRun, pipelineRunLabels, tektonResultAnnotations, getPipelineRunAnnotation } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { VectorSquare } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { PATH_PIPELINE_DETAILS_FULL } from "../../../pages/pipeline-details/route";
import { Actions } from "../components/Actions";
import { columnNames } from "../constants";
import { PipelineRunGraphDialog } from "../../../dialogs/PipelineRunGraph";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { StatusColumn } from "../components/columns/Status";

export const useColumns = ({
  tableSettings,
  detailRoutePath,
}: {
  tableSettings: SavedTableSettings | undefined;
  /** Override the route path used for row detail links. Defaults to PATH_PIPELINERUN_DETAILS_FULL. */
  detailRoutePath?: string;
}): TableColumn<PipelineRun>[] => {
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const openPipelineRunGraphDialog = useDialogOpener(PipelineRunGraphDialog);

  const rowDetailRoute = detailRoutePath ?? PATH_PIPELINERUN_DETAILS_FULL;

  return React.useMemo(
    () => [
      {
        id: columnNames.RUN,
        label: "Run",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({ data }) => {
            const {
              metadata: { name, namespace },
            } = data;

            return (
              <Button variant="link" asChild className="w-full justify-start p-0 whitespace-normal">
                <Link
                  to={rowDetailRoute}
                  params={{
                    clusterName,
                    namespace: namespace || defaultNamespace,
                    name,
                  }}
                >
                  <ENTITY_ICON.pipelineRun className="text-muted-foreground/70" />
                  <TextWithTooltip text={name} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 17,
          ...getSyncedColumnData(tableSettings, columnNames.RUN),
        },
      },
      {
        id: columnNames.STATUS,
        label: "Status",
        data: {
          columnSortableValuePath: "status.conditions[0].status",
          render: ({ data }) => <StatusColumn pipelineRun={data} />,
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, columnNames.STATUS),
        },
      },
      {
        id: columnNames.PIPELINE,
        label: "Pipeline",
        data: {
          columnSortableValuePath: "spec.pipelineRef.name",
          render: ({ data }) => {
            const {
              metadata: { namespace },
              spec: { pipelineRef },
            } = data;

            const pipelineRefName = pipelineRef?.name;

            if (!pipelineRefName) {
              return null;
            }

            return (
              <Button variant="link" asChild className="w-full justify-start p-0 whitespace-normal">
                <Link
                  to={PATH_PIPELINE_DETAILS_FULL}
                  params={{
                    name: pipelineRefName,
                    namespace: namespace || defaultNamespace,
                    clusterName,
                  }}
                >
                  <ENTITY_ICON.pipeline className="text-muted-foreground/70" />
                  <TextWithTooltip text={pipelineRefName} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, columnNames.PIPELINE),
        },
      },
      {
        id: columnNames.CODEBASE,
        label: "Project",
        data: {
          columnSortableValuePath: `metadata.labels.${pipelineRunLabels.codebase}`,
          render: ({ data }) => {
            const {
              metadata: { namespace, labels },
            } = data;

            const codebaseName = labels?.[pipelineRunLabels.codebase];

            if (!codebaseName) {
              return null;
            }

            return (
              <Button variant="link" asChild className="w-full justify-start p-0 whitespace-normal">
                <Link
                  to={PATH_PROJECT_DETAILS_FULL}
                  params={{
                    name: codebaseName,
                    namespace: namespace || defaultNamespace,
                    clusterName,
                  }}
                >
                  <ENTITY_ICON.project className="text-muted-foreground/70" />
                  <TextWithTooltip text={codebaseName} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.CODEBASE),
        },
      },
      {
        id: columnNames.BRANCH,
        label: "Branch",
        data: {
          render: ({ data }) => {
            const branchName = getPipelineRunAnnotation(data, tektonResultAnnotations.gitBranch);

            if (!branchName) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }

            return (
              <div className="text-muted-foreground overflow-hidden text-sm">
                <TextWithTooltip text={branchName} />
              </div>
            );
          },
        },
        cell: {
          baseWidth: 8,
          ...getSyncedColumnData(tableSettings, columnNames.BRANCH),
        },
      },
      {
        id: columnNames.PULL_REQUEST,
        label: "PR",
        data: {
          render: ({ data }) => {
            const changeNumber = getPipelineRunAnnotation(data, tektonResultAnnotations.gitChangeNumber);
            const changeUrl = getPipelineRunAnnotation(data, tektonResultAnnotations.gitChangeUrl);

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
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.PULL_REQUEST),
        },
      },
      {
        id: columnNames.AUTHOR,
        label: "Author",
        data: {
          render: ({ data }) => {
            const author = getPipelineRunAnnotation(data, tektonResultAnnotations.gitAuthor);
            const avatarUrl = getPipelineRunAnnotation(data, tektonResultAnnotations.gitAvatar);

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
        id: columnNames.TYPE,
        label: "Type",
        data: {
          columnSortableValuePath: `metadata.labels.${pipelineRunLabels.pipelineType}`,
          render: ({ data }) => {
            const pipelineType = data.metadata.labels?.[pipelineRunLabels.pipelineType];

            if (!pipelineType) {
              return null;
            }

            return (
              <div className="text-muted-foreground text-sm">
                <TextWithTooltip text={pipelineType} />
              </div>
            );
          },
        },
        cell: {
          baseWidth: 6,
          ...getSyncedColumnData(tableSettings, columnNames.TYPE),
        },
      },
      {
        id: columnNames.STARTED_AT,
        label: "Started at",
        data: {
          columnSortableValuePath: "status.startTime",
          render: ({ data }) => {
            const startTime = data?.status?.startTime;

            if (!startTime) {
              return <span className="text-muted-foreground text-sm">-</span>;
            }

            return (
              <Tooltip title={formatUnixTimestamp(startTime)} delayDuration={500}>
                <span className="text-sm">{formatTimestamp(startTime)}</span>
              </Tooltip>
            );
          },
        },
        cell: {
          baseWidth: 9,
          ...getSyncedColumnData(tableSettings, columnNames.STARTED_AT),
        },
      },
      {
        id: columnNames.TIME,
        label: "Time",
        data: {
          customSortFn: (a, b) => {
            const aStartTime = a?.status?.startTime;
            const aCompletionTime = a?.status?.completionTime;
            const bStartTime = b?.status?.startTime;
            const bCompletionTime = b?.status?.completionTime;

            if (!aStartTime || !bStartTime) {
              return 0;
            }

            const now = Date.now();

            const aDurationTime = aCompletionTime
              ? new Date(aCompletionTime).getTime() - new Date(aStartTime).getTime()
              : now - new Date(aStartTime).getTime();

            const bDurationTime = bCompletionTime
              ? new Date(bCompletionTime).getTime() - new Date(bStartTime).getTime()
              : now - new Date(bStartTime).getTime();

            return aDurationTime - bDurationTime;
          },
          render: ({ data }) => {
            const completionTime = data?.status?.completionTime;
            const startTime = data?.status?.startTime;

            const activeDuration = formatDuration(startTime, completionTime);

            if (!activeDuration) {
              return null;
            }

            const durationParts = activeDuration.split(" ");

            const tooltipContent = (
              <div className="flex flex-col gap-1">
                {completionTime && (
                  <div>
                    <span className="font-medium">Finished at: </span>
                    <span>{formatTimestamp(completionTime)}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Duration: </span>
                  <span>{activeDuration}</span>
                </div>
              </div>
            );

            return (
              <Tooltip title={tooltipContent} delayDuration={500}>
                <span className="text-sm">
                  {/* De-emphasize seconds (ends with "s" in en-mini humanize language) */}
                  {durationParts.map((part, i) => (
                    <span key={i} className={part.endsWith("s") ? "text-muted-foreground" : undefined}>
                      {i > 0 ? " " : ""}
                      {part}
                    </span>
                  ))}
                </span>
              </Tooltip>
            );
          },
        },
        cell: {
          baseWidth: 7,
          props: { align: "right" },
          ...getSyncedColumnData(tableSettings, columnNames.TIME),
        },
      },
      {
        id: columnNames.DIAGRAM,
        label: "Diagram",
        data: {
          render: ({ data }) => {
            return (
              <Tooltip title="View Pipeline Run Diagram" delayDuration={500}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    openPipelineRunGraphDialog({
                      pipelineRunName: data.metadata.name,
                      namespace: data.metadata.namespace || defaultNamespace,
                    })
                  }
                >
                  <VectorSquare size={16} />
                </Button>
              </Tooltip>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.DIAGRAM),
        },
      },
      {
        id: columnNames.ACTIONS,
        label: "Actions",
        data: {
          render: ({ data }) => <Actions pipelineRun={data} />,
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.ACTIONS),
        },
      },
    ],
    [tableSettings, clusterName, defaultNamespace, openPipelineRunGraphDialog, rowDetailRoute]
  );
};
