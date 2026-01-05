import React from "react";
import { Task } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routeTaskDetails } from "@/modules/platform/tekton/pages/task-details/route";
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
          baseWidth: 25,
          ...getSyncedColumnData(tableSettings, "name"),
        },
      },
      {
        id: "description",
        label: "Description",
        data: {
          render: ({ data: { spec } }) => <TextWithTooltip text={spec?.description || ""} maxLineAmount={3} />,
        },
        cell: {
          baseWidth: 50,
          ...getSyncedColumnData(tableSettings, "description"),
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
          baseWidth: 25,
          ...getSyncedColumnData(tableSettings, "createdAt"),
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
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, "actions"),
        },
      },
    ],
    [clusterName, defaultNamespace, tableSettings]
  );
};
