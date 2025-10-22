import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { Actions } from "../../Actions";
import { columnNames } from "../constants";
import { TABLE } from "@/k8s/constants/tables";
import { getCDPipelineStatusIcon } from "@/k8s/api/groups/KRCI/CDPipeline";
import React from "react";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { CDPipeline } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Link } from "@tanstack/react-router";
import { routeCDPipelineDetails } from "../../../../details/route";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { MAIN_COLOR } from "@/k8s/constants/colors";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { sortByName } from "@/core/utils/sortByName";
import { ResponsiveChips } from "@/core/components/ResponsiveChips";
import { routeComponentDetails } from "@/modules/platform/codebases/pages/details/route";
import { Button } from "@/core/components/ui/button";

export const useColumns = (): TableColumn<CDPipeline>[] => {
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );
  const { loadSettings } = useTableSettings(TABLE.CDPIPELINE_LIST.id);
  const tableSettings = loadSettings();

  return React.useMemo(
    () =>
      [
        {
          id: columnNames.STATUS,
          label: "Status",
          data: {
            columnSortableValuePath: "status.status",
            render: ({ data }) => {
              const status = data?.status?.status;
              const detailedMessage = data?.status?.detailed_message;

              const cdPipelineStatusIcon = getCDPipelineStatusIcon(data);

              const title = (
                <>
                  <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                    {`Status: ${status || "Unknown"}`}
                  </Typography>
                  {status === CUSTOM_RESOURCE_STATUS.FAILED && (
                    <Typography variant={"subtitle2"} sx={{ mt: (t) => t.typography.pxToRem(10) }}>
                      {detailedMessage}
                    </Typography>
                  )}
                </>
              );

              return (
                <StatusIcon
                  Icon={cdPipelineStatusIcon.component}
                  color={cdPipelineStatusIcon.color}
                  isSpinning={cdPipelineStatusIcon.isSpinning}
                  Title={title}
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
          id: columnNames.NAME,
          label: "Deployment Flow",
          data: {
            columnSortableValuePath: "metadata.name",
            render: ({
              data: {
                metadata: { name, namespace },
              },
            }) => {
              return (
                <Button variant="link" asChild>
                  <Link
                    to={routeCDPipelineDetails.fullPath}
                    params={{
                      clusterName: clusterName,
                      name,
                      namespace: namespace || defaultNamespace,
                    }}
                  >
                    <TextWithTooltip text={name} />
                  </Link>
                </Button>
              );
            },
            customSortFn: (a, b) => sortByName(a.metadata.name, b.metadata.name),
          },
          cell: {
            customizable: false,
            ...getSyncedColumnData(tableSettings, columnNames.NAME, 15),
          },
        },
        {
          id: columnNames.DESCRIPTION,
          label: "Description",
          data: {
            render: ({ data: { spec } }) =>
              spec?.description && <TextWithTooltip text={spec.description} maxLineAmount={3} />,
          },
          cell: {
            ...getSyncedColumnData(tableSettings, columnNames.DESCRIPTION, 30),
          },
        },
        {
          id: columnNames.APPLICATIONS,
          label: "Applications",
          data: {
            render: ({
              data: {
                spec: { applications },
                metadata: { namespace },
              },
            }) => {
              return (
                <ResponsiveChips
                  chipsData={applications}
                  renderChip={(label, key) => {
                    return (
                      <Chip
                        key={key}
                        sx={{
                          backgroundColor: MAIN_COLOR.GREEN,
                          borderColor: "transparent",
                        }}
                        size="small"
                        label={
                          <Link
                            to={routeComponentDetails.fullPath}
                            params={{
                              clusterName,
                              name: label,
                              namespace: namespace!,
                            }}
                            style={{ color: "white" }}
                          >
                            {label}
                          </Link>
                        }
                      />
                    );
                  }}
                  renderTooltip={(chipsToHide) => {
                    return (
                      <Box
                        sx={{
                          py: (t) => t.typography.pxToRem(6),
                          px: (t) => t.typography.pxToRem(10),
                        }}
                      >
                        <Stack spacing={1.5} flexWrap="wrap" sx={{ fontWeight: 400 }}>
                          {chipsToHide.map((label) => (
                            <Chip
                              key={label}
                              sx={{
                                backgroundColor: MAIN_COLOR.GREEN,
                                borderColor: "transparent",
                              }}
                              size="small"
                              label={
                                <Link
                                  to={routeComponentDetails.fullPath}
                                  params={{
                                    name: label,
                                    namespace: namespace!,
                                    clusterName,
                                  }}
                                  style={{ color: "white" }}
                                >
                                  {label}
                                </Link>
                              }
                            />
                          ))}
                        </Stack>
                      </Box>
                    );
                  }}
                />
              );
            },
          },
          cell: {
            ...getSyncedColumnData(tableSettings, columnNames.APPLICATIONS, 45),
          },
        },
        {
          id: columnNames.ACTIONS,
          label: "Actions",
          data: {
            render: ({ data }) => <Actions resource={data} />,
          },
          cell: {
            customizable: false,
            isFixed: true,
            ...getSyncedColumnData(tableSettings, columnNames.ACTIONS, 5),
          },
        },
      ] as TableColumn<CDPipeline>[],
    [clusterName, defaultNamespace, tableSettings]
  );
};
