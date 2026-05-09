import React from "react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Webhook } from "lucide-react";
import { EventListener } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { routeEventListenerDetails } from "@/modules/platform/tekton/pages/event-listener-details/route";

const isReady = (el: EventListener): boolean =>
  el.status?.conditions?.find((c) => c.type === "Ready")?.status === "True";

const triggerCount = (el: EventListener): number => el.spec?.triggers?.length ?? 0;

const address = (el: EventListener): string => el.status?.address?.url ?? "";

export function useColumns(): TableColumn<EventListener>[] {
  const { loadSettings } = useTableSettings(TABLE.EVENT_LISTENER_LIST.id);
  const tableSettings = loadSettings();
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({ namespace: state.defaultNamespace, clusterName: state.clusterName }))
  );

  return React.useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({ data }) => {
            const { name, namespace } = data.metadata;
            return (
              <Button variant="link" asChild className="p-0">
                <Link
                  to={routeEventListenerDetails.fullPath}
                  params={{ clusterName, namespace: namespace || defaultNamespace, name }}
                >
                  <Webhook className="text-muted-foreground/70 size-4" />
                  <TextWithTooltip text={name} />
                </Link>
              </Button>
            );
          },
        },
        cell: { isFixed: true, baseWidth: 30, ...getSyncedColumnData(tableSettings, "name") },
      },
      {
        id: "namespace",
        label: "Namespace",
        data: { render: ({ data }) => <span>{data.metadata.namespace}</span> },
        cell: { baseWidth: 15, ...getSyncedColumnData(tableSettings, "namespace") },
      },
      {
        id: "status",
        label: "Status",
        data: {
          render: ({ data }) =>
            isReady(data) ? (
              <Badge className="bg-primary/10 text-primary">Ready</Badge>
            ) : (
              <Badge className="bg-destructive/10 text-destructive">Degraded</Badge>
            ),
        },
        cell: { baseWidth: 10, ...getSyncedColumnData(tableSettings, "status") },
      },
      {
        id: "triggers",
        label: "Triggers",
        data: { render: ({ data }) => <span>{triggerCount(data)}</span> },
        cell: { baseWidth: 10, ...getSyncedColumnData(tableSettings, "triggers") },
      },
      {
        id: "address",
        label: "Address",
        data: {
          render: ({ data }) => <TextWithTooltip text={address(data) || "—"} />,
        },
        cell: { baseWidth: 25, ...getSyncedColumnData(tableSettings, "address") },
      },
      {
        id: "createdAt",
        label: "Age",
        data: {
          render: ({ data }) => formatTimestamp(data.metadata.creationTimestamp),
        },
        cell: { isFixed: true, baseWidth: 10, ...getSyncedColumnData(tableSettings, "createdAt") },
      },
    ],
    [tableSettings, clusterName, defaultNamespace]
  );
}
