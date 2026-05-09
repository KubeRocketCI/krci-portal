import React from "react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Link2 } from "lucide-react";
import { TriggerBinding, EventListener, Trigger } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { Button } from "@/core/components/ui/button";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { useEventListenerWatchList } from "@/k8s/api/groups/Tekton/EventListener";
import { useTriggerWatchList } from "@/k8s/api/groups/Tekton/Trigger";
import { routeTriggerBindingDetails } from "@/modules/platform/tekton/pages/trigger-binding-details/route";

const paramsCount = (tb: TriggerBinding): number => tb.spec?.params?.length ?? 0;

const usedByCount = (tb: TriggerBinding, els: EventListener[], triggers: Trigger[]): number => {
  const name = tb.metadata.name;
  const ns = tb.metadata.namespace;
  let count = 0;
  for (const el of els) {
    if (el.metadata.namespace !== ns) continue;
    count += (el.spec?.triggers ?? []).filter((entry) =>
      (entry.bindings ?? []).some((b) => b.ref === name && (b.kind ?? "TriggerBinding") === "TriggerBinding")
    ).length;
  }
  for (const t of triggers) {
    if (t.metadata.namespace !== ns) continue;
    if ((t.spec?.bindings ?? []).some((b) => b.ref === name && (b.kind ?? "TriggerBinding") === "TriggerBinding"))
      count += 1;
  }
  return count;
};

export function useColumns(): TableColumn<TriggerBinding>[] {
  const { loadSettings } = useTableSettings(TABLE.TRIGGER_BINDING_LIST.id);
  const tableSettings = loadSettings();
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((s) => ({ namespace: s.defaultNamespace, clusterName: s.clusterName }))
  );
  const els = useEventListenerWatchList().data.array;
  const triggers = useTriggerWatchList().data.array;

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
                  to={routeTriggerBindingDetails.fullPath}
                  params={{ clusterName, namespace: namespace || defaultNamespace, name }}
                >
                  <Link2 className="text-muted-foreground/70 size-4" />
                  <TextWithTooltip text={name} />
                </Link>
              </Button>
            );
          },
        },
        cell: { isFixed: true, baseWidth: 35, ...getSyncedColumnData(tableSettings, "name") },
      },
      {
        id: "namespace",
        label: "Namespace",
        data: { render: ({ data }) => <span>{data.metadata.namespace}</span> },
        cell: { baseWidth: 15, ...getSyncedColumnData(tableSettings, "namespace") },
      },
      {
        id: "params",
        label: "Params",
        data: { render: ({ data }) => <span>{paramsCount(data)}</span> },
        cell: { baseWidth: 15, ...getSyncedColumnData(tableSettings, "params") },
      },
      {
        id: "usedBy",
        label: "Used by",
        data: { render: ({ data }) => <span>{usedByCount(data, els, triggers)}</span> },
        cell: { baseWidth: 15, ...getSyncedColumnData(tableSettings, "usedBy") },
      },
      {
        id: "createdAt",
        label: "Age",
        data: {
          render: ({ data }) => formatTimestamp(data.metadata.creationTimestamp),
        },
        cell: { isFixed: true, baseWidth: 20, ...getSyncedColumnData(tableSettings, "createdAt") },
      },
    ],
    [tableSettings, clusterName, defaultNamespace, els, triggers]
  );
}
