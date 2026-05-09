import React from "react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Funnel } from "lucide-react";
import { Interceptor, EventListener, Trigger } from "@my-project/shared";
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
import { routeInterceptorDetails } from "@/modules/platform/tekton/pages/interceptor-details/route";

const formatAddress = (it: Interceptor): string => {
  const cc = it.spec?.clientConfig;
  if (cc?.url) return cc.url;
  if (cc?.service?.name) {
    const port = cc.service.port ? `:${cc.service.port}` : "";
    return `${cc.service.namespace ?? ""}/${cc.service.name}${port}`;
  }
  return "—";
};

type InterceptorRefHolder = { ref?: { name?: string; kind?: string } };

const usedByCount = (it: Interceptor, els: EventListener[], triggers: Trigger[]): number => {
  const name = it.metadata.name;
  const ns = it.metadata.namespace;
  // Raw Tekton specs use kind "Interceptor" for namespaced refs (or omit it,
  // since "Interceptor" is the default). "NamespacedInterceptor" is an
  // internal alias used only by useEventListenerTopology, so we must not
  // match against it here.
  const matches = (ref: { name?: string; kind?: string } | undefined) =>
    ref?.name === name && ref?.kind !== "ClusterInterceptor";
  let count = 0;
  for (const el of els) {
    if (el.metadata.namespace !== ns) continue;
    const elTriggers = el.spec?.triggers ?? [];
    count += elTriggers.filter(
      (entry) => entry.interceptors?.some((i: InterceptorRefHolder) => matches(i.ref)) ?? false
    ).length;
  }
  for (const t of triggers) {
    if (t.metadata.namespace !== ns) continue;
    if (t.spec?.interceptors?.some((i: InterceptorRefHolder) => matches(i.ref))) count += 1;
  }
  return count;
};

export function useColumns(): TableColumn<Interceptor>[] {
  const { loadSettings } = useTableSettings(TABLE.INTERCEPTOR_LIST.id);
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
                  to={routeInterceptorDetails.fullPath}
                  params={{ clusterName, namespace: namespace || defaultNamespace, name }}
                >
                  <Funnel className="text-muted-foreground/70 size-4" />
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
        id: "address",
        label: "Address",
        data: { render: ({ data }) => <TextWithTooltip text={formatAddress(data)} /> },
        cell: { baseWidth: 35, ...getSyncedColumnData(tableSettings, "address") },
      },
      {
        id: "usedBy",
        label: "Used by",
        data: { render: ({ data }) => <span>{usedByCount(data, els, triggers)}</span> },
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
    [tableSettings, clusterName, defaultNamespace, els, triggers]
  );
}
