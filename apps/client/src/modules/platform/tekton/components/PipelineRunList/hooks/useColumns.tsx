import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { CopyButton } from "@/core/components/CopyButton";
import { StatusIcon } from "@/core/components/StatusIcon";
import { SavedTableSettings } from "@/core/components/Table/components/TableSettings/types";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { useClusterStore } from "@/k8s/store";
import { humanize, formatTimestamp } from "@/core/utils/date-humanize";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { PATH_COMPONENT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import {
  getPipelineRunStatus,
  PipelineRun,
  pipelineRunLabels,
  tektonResultAnnotations,
  getPipelineRunAnnotation,
} from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { Clock, VectorSquare } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { PATH_PIPELINE_DETAILS_FULL } from "../../../pages/pipeline-details/route";
import { PipelineRunResults } from "../components/PipelineRunResults";
import { Actions } from "../components/Actions";
import { columnNames } from "../constants";
import { PipelineRunGraphDialog } from "../../../dialogs/PipelineRunGraph";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";

export const useColumns = ({
  tableSettings,
}: {
  tableSettings: SavedTableSettings | undefined;
}): TableColumn<PipelineRun>[] => {
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const openPipelineRunGraphDialog = useDialogOpener(PipelineRunGraphDialog);

  return React.useMemo(
    () => [
      {
        id: columnNames.STATUS,
        label: "Status",
        data: {
          columnSortableValuePath: "status.conditions[0].status",
          render: ({ data }) => {
            const statusIcon = getPipelineRunStatusIcon(data);
            const status = getPipelineRunStatus(data);

            return (
              <StatusIcon
                Icon={statusIcon.component}
                color={statusIcon.color}
                isSpinning={statusIcon.isSpinning}
                width={25}
                Title={`Status: ${status.status}. Reason: ${status.reason}`}
              />
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 4,
          ...getSyncedColumnData(tableSettings, columnNames.STATUS),
        },
      },
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
                  to={PATH_PIPELINERUN_DETAILS_FULL}
                  params={{
                    clusterName,
                    namespace: namespace || defaultNamespace,
                    name,
                  }}
                >
                  <TextWithTooltip text={name} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 14,
          ...getSyncedColumnData(tableSettings, columnNames.RUN),
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
                  <TextWithTooltip text={pipelineRefName} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 14,
          ...getSyncedColumnData(tableSettings, columnNames.PIPELINE),
        },
      },
      {
        id: columnNames.CODEBASE,
        label: "Codebase",
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
                  to={PATH_COMPONENT_DETAILS_FULL}
                  params={{
                    name: codebaseName,
                    namespace: namespace || defaultNamespace,
                    clusterName,
                  }}
                >
                  <TextWithTooltip text={codebaseName} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 11,
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
              <div className="text-muted-foreground text-sm">
                <TextWithTooltip text={branchName} />
              </div>
            );
          },
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, columnNames.BRANCH),
        },
      },
      {
        id: columnNames.RESULTS,
        label: "Results",
        data: {
          render: ({ data }) => {
            const vcsTag = data?.status?.results?.find(
              (el: { name: string; value?: string }) => el.name === "VCS_TAG"
            )?.value;

            if (!vcsTag) {
              return null;
            }

            return (
              <Tooltip title={<PipelineRunResults pipelineRun={data} />}>
                <div className="flex items-center gap-0.5">
                  <span className="border-muted max-w-[300px] overflow-hidden border-b border-dashed text-sm text-ellipsis whitespace-nowrap">
                    {vcsTag}
                  </span>
                  <CopyButton text={vcsTag} size="small" />
                </div>
              </Tooltip>
            );
          },
        },
        cell: {
          baseWidth: 9,
          ...getSyncedColumnData(tableSettings, columnNames.RESULTS),
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
        id: columnNames.TIME,
        label: "Time",
        data: {
          customSortFn: (a, b) => {
            const aStartTime = a?.status?.startTime;
            const aCompletionTime = a?.status?.completionTime;
            const bStartTime = b?.status?.startTime;
            const bCompletionTime = b?.status?.completionTime;

            if (!aStartTime || !aCompletionTime || !bStartTime || !bCompletionTime) {
              return 0;
            }

            const aDurationTime = aCompletionTime
              ? new Date(aCompletionTime).getTime() - new Date(aStartTime).getTime()
              : new Date().getTime() - new Date(aStartTime).getTime();

            const bDurationTime = bCompletionTime
              ? new Date(bCompletionTime).getTime() - new Date(bStartTime).getTime()
              : new Date().getTime() - new Date(bStartTime).getTime();

            if (aDurationTime < bDurationTime) {
              return -1;
            } else if (aDurationTime > bDurationTime) {
              return 1;
            }

            return 0;
          },
          render: ({ data }) => {
            const completionTime = data?.status?.completionTime;
            const startTime = data?.status?.startTime;

            if (!startTime) {
              return null;
            }

            const durationTime = completionTime
              ? new Date(completionTime).getTime() - new Date(startTime).getTime()
              : new Date().getTime() - new Date(startTime).getTime();

            const activeDuration = humanize(durationTime, {
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
              <Tooltip title={tooltipContent}>
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-sm">{activeDuration}</span>
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
      {
        id: columnNames.DIAGRAM,
        label: "Diagram",
        data: {
          render: ({ data }) => {
            return (
              <Tooltip title="View Pipeline Run Diagram">
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
    [tableSettings, clusterName, defaultNamespace, openPipelineRunGraphDialog]
  );
};
