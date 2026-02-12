import { StatusIcon } from "@/core/components/StatusIcon";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getCodebaseMappingByType, getCodebaseStatusIcon } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { Codebase, codebaseType } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { Box } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { routeProjectDetails } from "../../../../details/route";
import { Actions } from "../../ComponentActions";
import { columnNames } from "../constants";

export const useColumns = (): TableColumn<Codebase>[] => {
  const { loadSettings } = useTableSettings(TABLE.COMPONENT_LIST.id);
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const tableSettings = loadSettings();

  return React.useMemo(
    () => [
      {
        id: columnNames.STATUS,
        label: "Status",
        data: {
          columnSortableValuePath: "status.status",
          render: ({ data }) => {
            const status = data?.status?.status;
            const detailedMessage = data?.status?.detailedMessage;

            const { component, color, isSpinning } = getCodebaseStatusIcon(data);

            const title = (
              <>
                <p className="text-sm font-semibold">{`Status: ${status || "Unknown"}`}</p>
                {status === CUSTOM_RESOURCE_STATUS.FAILED && (
                  <p className="mt-3 text-sm font-medium">{detailedMessage}</p>
                )}
              </>
            );

            return <StatusIcon Icon={component} isSpinning={isSpinning} color={color} Title={title} width={16} />;
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.STATUS),
          props: {
            align: "left",
          },
        },
      },
      {
        id: columnNames.NAME,
        label: "Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({
            data: {
              metadata: { name, namespace },
            },
          }) => {
            return (
              <Button variant="link" asChild className="px-4 py-0">
                <Link to={routeProjectDetails.fullPath} params={{ clusterName, namespace: namespace!, name }}>
                  <span className="flex items-center gap-2">
                    <Box className="text-muted-foreground/70" />
                    <TextWithTooltip text={name} />
                  </span>
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
        id: columnNames.TYPE,
        label: "Type",
        data: {
          columnSortableValuePath: "spec.type",
          render: ({
            data: {
              spec: { type },
            },
          }) => {
            return <Badge variant="outline">{capitalizeFirstLetter(type)}</Badge>;
          },
        },
        cell: {
          baseWidth: 20,
          ...getSyncedColumnData(tableSettings, columnNames.TYPE),
        },
      },
      {
        id: columnNames.LANGUAGE,
        label: "Language / Framework",
        data: {
          render: ({
            data: {
              spec: { lang: _lang, framework: _framework, type },
            },
          }) => {
            const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
            const lang = _lang.toLowerCase();
            const framework = _framework ? _framework.toLowerCase() : "N/A";
            const codebaseMappingByLang = codebaseMapping?.[lang];

            return (
              <div className="flex flex-col flex-nowrap gap-0.5">
                <div className="text-foreground text-sm">
                  {codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_lang)}
                </div>
                <div className="text-muted-foreground text-xs">
                  {framework
                    ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                      (_framework && capitalizeFirstLetter(_framework)) ||
                      "N/A"
                    : "N/A"}
                </div>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 15,
          ...getSyncedColumnData(tableSettings, columnNames.LANGUAGE),
        },
      },
      {
        id: columnNames.BUILD_TOOL,
        label: "Build Tool",
        data: {
          render: ({
            data: {
              spec: { lang: _lang, buildTool: _buildTool, type },
            },
          }) => {
            const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
            const lang = _lang.toLowerCase();
            const buildTool = _buildTool.toLowerCase();
            const codebaseMappingByLang = codebaseMapping?.[lang];

            return (
              <div className="text-foreground text-sm">
                {codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}
              </div>
            );
          },
        },
        cell: {
          baseWidth: 15,
          ...getSyncedColumnData(tableSettings, columnNames.BUILD_TOOL),
        },
      },

      {
        id: columnNames.ACTIONS,
        label: "Actions",
        data: {
          render: ({ data }) => {
            return (
              <Actions
                resource={data}
                disabled={{
                  boolean: data.spec.type === codebaseType.system,
                  reason: "System projects cannot be managed",
                }}
              />
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.ACTIONS),
          props: {
            align: "center",
          },
        },
      },
    ],
    [clusterName, tableSettings]
  );
};
