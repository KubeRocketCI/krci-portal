import React from "react";
import { Task } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routeTaskDetails } from "@/modules/platform/tasks/pages/details/route";
import { Link } from "@tanstack/react-router";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { TABLE } from "@/k8s/constants/tables";
import { Actions } from "../components/Actions";
import { Button } from "@/core/components/ui/button";

export const useColumns = (): TableColumn<Task>[] => {
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const { loadSettings } = useTableSettings(TABLE.TASK_LIST.id);

  const tableSettings = loadSettings();

  return React.useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({
            data: {
              metadata: { name, namespace },
            },
          }) => (
            <Button variant="link" asChild className="p-0">
              <Link
                to={routeTaskDetails.fullPath}
                params={{
                  clusterName,
                  namespace: namespace || defaultNamespace,
                  name,
                }}
              >
                <TextWithTooltip text={name} />
              </Link>
            </Button>
          ),
        },
        cell: {
          customizable: false,
          ...getSyncedColumnData(tableSettings, "name", 25),
        },
      },
      {
        id: "description",
        label: "Description",
        data: {
          render: ({ data: { spec } }) => <TextWithTooltip text={spec?.description || ""} maxLineAmount={3} />,
        },
        cell: {
          ...getSyncedColumnData(tableSettings, "description", 50),
        },
      },
      {
        id: "createdAt",
        label: "Created At",
        data: {
          render: ({
            data: {
              metadata: { creationTimestamp },
            },
          }) => {
            return new Date(creationTimestamp).toLocaleString("en-mini", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            });
          },
        },
        cell: {
          isFixed: true,
          ...getSyncedColumnData(tableSettings, "createdAt", 25),
        },
      },
      {
        id: "actions",
        label: "Actions",
        data: {
          render: ({ data }) => <Actions task={data} />,
        },
        cell: {
          isFixed: true,
          customizable: false,
          ...getSyncedColumnData(tableSettings, "actions", 5),
        },
      },
    ],
    [clusterName, defaultNamespace, tableSettings]
  );
};
