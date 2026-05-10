import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatTimestamp, formatUnixTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { PATH_K8S_POD_DETAIL_FULL } from "../../detail/route";
import type { TableColumn } from "@/core/components/Table/types";
import type { Pod } from "@my-project/shared";

export function useColumns(): TableColumn<Pod>[] {
  const clusterName = useClusterStore((s) => s.clusterName) ?? "";

  return useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          render: ({ data }) => (
            <Button variant="link" asChild className="w-full justify-start p-0">
              <Link
                to={PATH_K8S_POD_DETAIL_FULL}
                params={{
                  clusterName,
                  namespace: data.metadata?.namespace ?? "",
                  name: data.metadata?.name ?? "",
                }}
              >
                <TextWithTooltip text={data.metadata?.name ?? "—"} />
              </Link>
            </Button>
          ),
          columnSortableValuePath: "metadata.name",
        },
        cell: { baseWidth: 20 },
      },
      {
        id: "namespace",
        label: "Namespace",
        data: {
          render: ({ data }) => <TextWithTooltip text={data.metadata?.namespace ?? "—"} />,
          columnSortableValuePath: "metadata.namespace",
        },
        cell: { baseWidth: 12 },
      },
      {
        id: "status",
        label: "Status",
        data: {
          render: ({ data }) => (data as { status?: { phase?: string } }).status?.phase ?? "—",
        },
        cell: { baseWidth: 10 },
      },
      {
        id: "ready",
        label: "Ready",
        data: {
          render: ({ data }) => {
            const cs =
              (data as { status?: { containerStatuses?: { ready?: boolean }[] } }).status?.containerStatuses ?? [];
            const ready = cs.filter((c) => c.ready).length;
            return `${ready}/${cs.length}`;
          },
        },
        cell: { baseWidth: 8 },
      },
      {
        id: "restarts",
        label: "Restarts",
        data: {
          render: ({ data }) => {
            const cs =
              (data as { status?: { containerStatuses?: { restartCount?: number }[] } }).status?.containerStatuses ??
              [];
            return String(cs.reduce((acc, c) => acc + (c.restartCount ?? 0), 0));
          },
        },
        cell: { baseWidth: 8 },
      },
      {
        id: "node",
        label: "Node",
        data: {
          render: ({ data }) => (data as { spec?: { nodeName?: string } }).spec?.nodeName ?? "—",
        },
        cell: { baseWidth: 15 },
      },
      {
        id: "age",
        label: "Created at",
        data: {
          render: ({ data }) => {
            const ts = data.metadata?.creationTimestamp;
            if (!ts) return "—";
            return (
              <Tooltip title={formatUnixTimestamp(ts)} delayDuration={500}>
                <span className="text-sm">{formatTimestamp(ts)}</span>
              </Tooltip>
            );
          },
          columnSortableValuePath: "metadata.creationTimestamp",
        },
        cell: { baseWidth: 13 },
      },
    ],
    [clusterName]
  );
}
