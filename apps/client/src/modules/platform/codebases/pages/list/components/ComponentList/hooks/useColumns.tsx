import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getCodebaseStatusIcon } from "@/k8s/api/groups/KRCI/Codebase";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { ResourceStatusBadge } from "@/k8s/components/ResourceStatusBadge";
import { CodebaseLanguageIcon } from "@/modules/platform/codebases/components/CodebaseLanguageIcon";
import { CodebaseFrameworkIcon } from "@/modules/platform/codebases/components/CodebaseFrameworkIcon";
import { CodebaseBuildToolIcon } from "@/modules/platform/codebases/components/CodebaseBuildToolIcon";
import { Codebase, codebaseType } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
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
                    <ENTITY_ICON.project className="text-muted-foreground/70" />
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
        id: columnNames.STATUS,
        label: "Status",
        data: {
          columnSortableValuePath: "status.status",
          render: ({ data }) => {
            const status = data?.status?.status;
            const detailedMessage = data?.status?.detailedMessage;
            const statusIcon = getCodebaseStatusIcon(data);

            return <ResourceStatusBadge status={status} detailedMessage={detailedMessage} statusIcon={statusIcon} />;
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.STATUS),
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
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, columnNames.TYPE),
        },
      },
      {
        id: columnNames.LANGUAGE,
        label: "Language",
        data: {
          render: ({ data }) => <CodebaseLanguageIcon codebase={data} />,
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, columnNames.LANGUAGE),
        },
      },
      {
        id: columnNames.FRAMEWORK,
        label: "Framework",
        data: {
          render: ({ data }) => <CodebaseFrameworkIcon codebase={data} />,
        },
        cell: {
          baseWidth: 12,
          ...getSyncedColumnData(tableSettings, columnNames.FRAMEWORK),
        },
      },
      {
        id: columnNames.BUILD_TOOL,
        label: "Build Tool",
        data: {
          render: ({ data }) => <CodebaseBuildToolIcon codebase={data} />,
        },
        cell: {
          baseWidth: 12,
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
