import React from "react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Zap } from "lucide-react";
import { Trigger, EventListener } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { Button } from "@/core/components/ui/button";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { useEventListenerWatchList } from "@/k8s/api/groups/Tekton/EventListener";
import { routeTriggerDetails } from "@/modules/platform/tekton/pages/trigger-details/route";

const bindingsCount = (t: Trigger): number => t.spec?.bindings?.length ?? 0;

const templateRef = (t: Trigger): string => t.spec?.template?.ref ?? "—";

const usedByCount = (t: Trigger, els: EventListener[]): number => {
  const triggerName = t.metadata.name;
  const triggerNs = t.metadata.namespace;
  return els.filter((el) => {
    if (el.metadata.namespace !== triggerNs) return false;
    return (el.spec?.triggers ?? []).some((entry) => entry.triggerRef === triggerName);
  }).length;
};

export function useColumns(): TableColumn<Trigger>[] {
  const { loadSettings } = useTableSettings(TABLE.TRIGGER_LIST.id);
  const tableSettings = loadSettings();
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((s) => ({ namespace: s.defaultNamespace, clusterName: s.clusterName }))
  );
  const elsWatch = useEventListenerWatchList();
  const els = elsWatch.data.array;

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
                  to={routeTriggerDetails.fullPath}
                  params={{ clusterName, namespace: namespace || defaultNamespace, name }}
                >
                  <Zap className="text-muted-foreground/70 size-4" />
                  <TextWithTooltip text={name} />
                </Link>
              </Button>
            );
          },
        },
        cell: { isFixed: true, baseWidth: 25, ...getSyncedColumnData(tableSettings, "name") },
      },
      {
        id: "namespace",
        label: "Namespace",
        data: { render: ({ data }) => <span>{data.metadata.namespace}</span> },
        cell: { baseWidth: 15, ...getSyncedColumnData(tableSettings, "namespace") },
      },
      {
        id: "bindings",
        label: "Bindings",
        data: { render: ({ data }) => <span>{bindingsCount(data)}</span> },
        cell: { baseWidth: 10, ...getSyncedColumnData(tableSettings, "bindings") },
      },
      {
        id: "template",
        label: "Template",
        data: { render: ({ data }) => <TextWithTooltip text={templateRef(data)} /> },
        cell: { baseWidth: 25, ...getSyncedColumnData(tableSettings, "template") },
      },
      {
        id: "usedBy",
        label: "Used by",
        data: { render: ({ data }) => <span>{usedByCount(data, els)}</span> },
        cell: { baseWidth: 10, ...getSyncedColumnData(tableSettings, "usedBy") },
      },
      {
        id: "createdAt",
        label: "Age",
        data: {
          render: ({ data }) => formatTimestamp(data.metadata.creationTimestamp),
        },
        cell: { isFixed: true, baseWidth: 15, ...getSyncedColumnData(tableSettings, "createdAt") },
      },
    ],
    [tableSettings, clusterName, defaultNamespace, els]
  );
}
