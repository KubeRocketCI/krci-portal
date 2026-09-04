import React from "react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Webhook } from "lucide-react";
import { EventListener } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { routeEventListenerDetails } from "@/modules/platform/tekton/pages/event-listener-details/route";
import { labelSelectorTerms, parseLabelSelector } from "@/modules/platform/tekton/utils/labelSelector";

const isReady = (el: EventListener): boolean =>
  el.status?.conditions?.find((c) => c.type === "Ready")?.status === "True";

const triggerCount = (el: EventListener): number => el.spec?.triggers?.length ?? 0;

const address = (el: EventListener): string => el.status?.address?.url ?? "";

const selectorTerms = (el: EventListener): string[] => labelSelectorTerms(parseLabelSelector(el));

export function useColumns(): TableColumn<EventListener>[] {
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
        cell: { isFixed: true, baseWidth: 15 },
      },
      {
        id: "namespace",
        label: "Namespace",
        data: { render: ({ data }) => <span>{data.metadata.namespace}</span> },
        cell: { baseWidth: 8 },
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
        cell: { baseWidth: 7 },
      },
      {
        id: "triggers",
        label: "Triggers",
        data: { render: ({ data }) => <span>{triggerCount(data)}</span> },
        cell: { baseWidth: 7 },
      },
      {
        id: "address",
        label: "Address",
        data: {
          render: ({ data }) => <TextWithTooltip text={address(data) || "—"} />,
        },
        cell: { baseWidth: 26 },
      },
      {
        id: "labelSelector",
        label: "Label Selector",
        data: {
          render: ({ data }) => {
            const terms = selectorTerms(data);
            if (!terms.length) return <span>—</span>;
            return (
              <div className="flex flex-wrap items-center gap-1">
                {terms.map((term) => (
                  <Badge key={term} variant="secondary">
                    {term}
                  </Badge>
                ))}
              </div>
            );
          },
        },
        cell: { baseWidth: 25 },
      },
      {
        id: "createdAt",
        label: "Age",
        data: {
          render: ({ data }) => formatTimestamp(data.metadata.creationTimestamp),
        },
        cell: { isFixed: true, baseWidth: 12 },
      },
    ],
    [clusterName, defaultNamespace]
  );
}
