import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { Actions } from "../../Actions";
import { columnNames } from "../constants";
import { TABLE } from "@/k8s/constants/tables";
import { getCDPipelineStatusIcon } from "@/k8s/api/groups/KRCI/CDPipeline";
import React from "react";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { CDPipeline } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { Badge } from "@/core/components/ui/badge";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Link } from "@tanstack/react-router";
import { routeCDPipelineDetails } from "../../../../details/route";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { sortByName } from "@/core/utils/sortByName";
import { routeProjectDetails } from "@/modules/platform/codebases/pages/details/route";
import { Button } from "@/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Box, CloudUpload, Package } from "lucide-react";

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
                  <p className="text-sm font-semibold">{`Status: ${status || "Unknown"}`}</p>
                  {status === CUSTOM_RESOURCE_STATUS.FAILED && (
                    <p className="mt-3 text-sm font-medium">{detailedMessage}</p>
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
            baseWidth: 5,
            ...getSyncedColumnData(tableSettings, columnNames.STATUS),
          },
        },
        {
          id: columnNames.NAME,
          label: "Deployment",
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
                    <CloudUpload className="text-muted-foreground/70" />
                    <TextWithTooltip text={name} className="font-medium" />
                  </Link>
                </Button>
              );
            },
            customSortFn: (a, b) => sortByName(a.metadata.name, b.metadata.name),
          },
          cell: {
            baseWidth: 15,
            ...getSyncedColumnData(tableSettings, columnNames.NAME),
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
            baseWidth: 30,
            ...getSyncedColumnData(tableSettings, columnNames.DESCRIPTION),
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
                <div className="flex gap-1.5">
                  {applications.length <= 3 ? (
                    <div className="flex flex-wrap gap-1">
                      {applications.map((app) => (
                        <Badge key={app} variant="outline" className="text-xs">
                          <Button variant="link" asChild className="h-auto py-1 text-xs">
                            <Link
                              to={routeProjectDetails.fullPath}
                              params={{
                                clusterName,
                                name: app,
                                namespace: namespace!,
                              }}
                            >
                              <Box className="text-muted-foreground/70" />
                              {app}
                            </Link>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <>
                      {applications.slice(0, 2).map((app) => (
                        <Badge key={app} variant="outline" className="text-xs">
                          <Button variant="link" asChild className="h-auto py-1 text-xs">
                            <Link
                              to={routeProjectDetails.fullPath}
                              params={{
                                clusterName,
                                name: app,
                                namespace: namespace!,
                              }}
                            >
                              <Box className="text-muted-foreground/70" />
                              {app}
                            </Link>
                          </Button>
                        </Badge>
                      ))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground hover:bg-accent hover:border-primary/50 cursor-pointer py-1 text-xs [&>svg]:size-4"
                          >
                            <Package className="mr-1" />+{applications.length - 2} more
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-80 w-64 overflow-y-auto">
                          <div className="border-border text-muted-foreground border-b px-2 py-1.5 text-xs font-medium">
                            All Applications ({applications.length})
                          </div>
                          {applications.map((app) => (
                            <DropdownMenuItem key={app} className="text-xs" asChild>
                              <Link
                                to={routeProjectDetails.fullPath}
                                params={{
                                  clusterName,
                                  name: app,
                                  namespace: namespace!,
                                }}
                              >
                                <Package className="text-muted-foreground/70 mr-2" />
                                {app}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              );
            },
          },
          cell: {
            baseWidth: 45,
            ...getSyncedColumnData(tableSettings, columnNames.APPLICATIONS),
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
            baseWidth: 5,
            ...getSyncedColumnData(tableSettings, columnNames.ACTIONS),
          },
        },
      ] as TableColumn<CDPipeline>[],
    [clusterName, defaultNamespace, tableSettings]
  );
};
