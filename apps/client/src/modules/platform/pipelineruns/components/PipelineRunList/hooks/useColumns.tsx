import { CopyButton } from "@/core/components/CopyButton";
import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { StatusIcon } from "@/core/components/StatusIcon";
import { SavedTableSettings } from "@/core/components/Table/components/TableSettings/types";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { useClusterStore } from "@/k8s/store";
import { humanize } from "@/core/utils/date-humanize";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/pipelineruns/pages/details/route";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { getPipelineRunStatus, getPullRequestURL, PipelineRun } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { VectorSquare, ExternalLink } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { PATH_PIPELINE_DETAILS_FULL } from "../../../../pipelines/pages/details/route";
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
          baseWidth: 5,
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
              <Button variant="link" asChild className="p-0">
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
          baseWidth: 20,
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
              <Button variant="link" asChild className="p-0">
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
          baseWidth: 20,
          ...getSyncedColumnData(tableSettings, columnNames.PIPELINE),
        },
      },
      {
        id: columnNames.RESULTS,
        label: "Results",
        data: {
          render: ({ data }) => {
            const vcsTag = data?.status?.results?.find((el) => el.name === "VCS_TAG")?.value;

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
          baseWidth: 15,
          ...getSyncedColumnData(tableSettings, columnNames.RESULTS),
        },
      },
      {
        id: columnNames.PULL_REQUEST,
        label: "Pull Request",
        data: {
          render: ({ data }) => {
            const link = getPullRequestURL(data);

            if (!link) {
              return null;
            }

            return (
              <ResourceIconLink
                tooltipTitle={"Go to the Pull Request page"}
                link={link}
                Icon={<ExternalLink />}
                name="pull request"
              />
            );
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.PULL_REQUEST),
          props: {
            align: "center",
          },
        },
      },
      {
        id: columnNames.STARTED_AT,
        label: "Started at",
        data: {
          customSortFn: (a, b) => {
            const aStartTime = a?.status?.startTime;
            const bStartTime = b?.status?.startTime;

            if (!aStartTime || !bStartTime) {
              return 0;
            }

            const aStartTimeDate = new Date(aStartTime).getTime();
            const bStartTimeDate = new Date(bStartTime).getTime();

            if (aStartTimeDate < bStartTimeDate) {
              return -1;
            } else if (aStartTimeDate > bStartTimeDate) {
              return 1;
            }

            return 0;
          },
          render: ({ data }) => {
            const startTime = data.status?.startTime;
            if (!startTime) {
              return null;
            }

            const startedAt = new Date(startTime).toLocaleString("en-mini", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            });

            return startedAt;
          },
        },
        cell: {
          baseWidth: 10,
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

            if (!completionTime || !startTime) {
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

            return activeDuration;
          },
        },
        cell: {
          baseWidth: 5,
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
