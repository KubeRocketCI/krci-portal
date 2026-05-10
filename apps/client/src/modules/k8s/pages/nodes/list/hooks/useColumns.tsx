import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatTimestamp, formatUnixTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { PATH_K8S_NODE_DETAIL_FULL } from "../../detail/route";
import type { TableColumn } from "@/core/components/Table/types";
import type { Node } from "@my-project/shared";

interface NodeStatus {
  conditions?: { type?: string; status?: string }[];
  capacity?: Record<string, string>;
  allocatable?: Record<string, string>;
  nodeInfo?: { kubeletVersion?: string };
  addresses?: { type?: string; address?: string }[];
}

export function useColumns(): TableColumn<Node>[] {
  const clusterName = useClusterStore((s) => s.clusterName) ?? "";

  return useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          render: ({ data }) => (
            <Button variant="link" asChild className="w-full justify-start p-0">
              <Link to={PATH_K8S_NODE_DETAIL_FULL} params={{ clusterName, name: data.metadata?.name ?? "" }}>
                <TextWithTooltip text={data.metadata?.name ?? "—"} />
              </Link>
            </Button>
          ),
          columnSortableValuePath: "metadata.name",
        },
        cell: { baseWidth: 22 },
      },
      {
        id: "status",
        label: "Status",
        data: {
          render: ({ data }) => {
            const ready = ((data as { status?: NodeStatus }).status?.conditions ?? []).find((c) => c.type === "Ready");
            return ready?.status === "True" ? "Ready" : "NotReady";
          },
        },
        cell: { baseWidth: 10 },
      },
      {
        id: "roles",
        label: "Roles",
        data: {
          render: ({ data }) =>
            Object.keys(data.metadata?.labels ?? {})
              .filter((k) => k.startsWith("node-role.kubernetes.io/"))
              .map((k) => k.split("/")[1])
              .filter(Boolean)
              .join(", ") || "—",
        },
        cell: { baseWidth: 12 },
      },
      {
        id: "version",
        label: "Version",
        data: {
          render: ({ data }) => (data as { status?: NodeStatus }).status?.nodeInfo?.kubeletVersion ?? "—",
        },
        cell: { baseWidth: 12 },
      },
      {
        id: "cpu",
        label: "CPU",
        data: {
          render: ({ data }) => (data as { status?: NodeStatus }).status?.capacity?.cpu ?? "—",
        },
        cell: { baseWidth: 8 },
      },
      {
        id: "memory",
        label: "Memory",
        data: {
          render: ({ data }) => (data as { status?: NodeStatus }).status?.capacity?.memory ?? "—",
        },
        cell: { baseWidth: 12 },
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
