import { CopyButton } from "@/core/components/CopyButton";
import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { StatusIcon } from "@/core/components/StatusIcon";
import { SavedTableSettings } from "@/core/components/Table/components/TableSettings/types";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { getPipelineRunStatusIcon } from "@/core/k8s/api/groups/Tekton/PipelineRun/utils";
import { useClusterStore } from "@/core/store";
import { humanize } from "@/core/utils/date-humanize";
import { routePipelineRunDetails } from "@/modules/platform/pipelineruns/pages/details/route";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { getPipelineRunStatus, getPullRequestURL, PipelineRun } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { ChartNetwork, ExternalLink } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { routePipelineDetails } from "../../../pages/details/route";
import { PipelineRunResults } from "../../PipelineRunResults";
import { Actions } from "../components/Actions";
import { columnNames } from "../constants";

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

  // const { setDialog } = useDialogContext();

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
          ...getSyncedColumnData(tableSettings, columnNames.STATUS, 5),
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
              <Link
                to={routePipelineRunDetails.fullPath}
                params={{
                  clusterName,
                  namespace: namespace || defaultNamespace,
                  name,
                }}
              >
                <TextWithTooltip text={name} />
              </Link>
            );
          },
        },
        cell: {
          customizable: false,
          ...getSyncedColumnData(tableSettings, columnNames.RUN, 20),
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
              spec: {
                pipelineRef: { name: pipelineRefName },
              },
            } = data;

            return (
              <Link
                to={routePipelineDetails.fullPath}
                params={{
                  name: pipelineRefName,
                  namespace: namespace || defaultNamespace,
                  clusterName,
                }}
              >
                <TextWithTooltip text={pipelineRefName} />
              </Link>
            );
          },
        },
        cell: {
          ...getSyncedColumnData(tableSettings, columnNames.PIPELINE, 20),
        },
      },
      {
        id: columnNames.RESULTS,
        label: "Results",
        data: {
          render: ({ data }) => {
            const vcsTag = data?.status?.results?.find(
              (el: { name: string; value: string }) => el.name === "VCS_TAG"
            )?.value;

            if (!vcsTag) {
              return null;
            }

            return (
              <Tooltip title={<PipelineRunResults pipelineRun={data} />}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography
                    variant="body2"
                    sx={{
                      borderBottom: (t) => `1px dashed ${t.palette.action.disabled}`,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: (t) => t.typography.pxToRem(300),
                    }}
                  >
                    {vcsTag}
                  </Typography>
                  <CopyButton text={vcsTag} size="small" />
                </Stack>
              </Tooltip>
            );
          },
        },
        cell: {
          ...getSyncedColumnData(tableSettings, columnNames.RESULTS, 15),
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
          ...getSyncedColumnData(tableSettings, columnNames.PULL_REQUEST, 10),

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
            const startedAt = new Date(data.status?.startTime).toLocaleString("en-mini", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            });

            return startedAt;
          },
        },
        cell: {
          ...getSyncedColumnData(tableSettings, columnNames.STARTED_AT, 10),
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
            const durationTime = completionTime
              ? new Date(completionTime).getTime() - new Date(data.status?.startTime).getTime()
              : new Date().getTime() - new Date(data.status?.startTime).getTime();

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
          ...getSyncedColumnData(tableSettings, columnNames.TIME, 5),
        },
      },
      {
        id: columnNames.DIAGRAM,
        label: "Diagram",
        data: {
          render: () => {
            return (
              <IconButton
                // onClick={() =>
                // setDialog(PipelineRunGraphDialog, {
                //   pipelineRun: data,
                // })
                // }
                size="medium"
              >
                <ChartNetwork />
              </IconButton>
            );
          },
        },
        cell: {
          isFixed: true,
          ...getSyncedColumnData(tableSettings, columnNames.DIAGRAM, 5),
        },
      },
      {
        id: columnNames.ACTIONS,
        label: "Actions",
        data: {
          render: ({ data }) => <Actions resource={data} />,
        },
        cell: {
          isFixed: true,
          customizable: false,
          ...getSyncedColumnData(tableSettings, columnNames.ACTIONS, 5),
        },
      },
    ],
    [clusterName, defaultNamespace, tableSettings]
  );
};
