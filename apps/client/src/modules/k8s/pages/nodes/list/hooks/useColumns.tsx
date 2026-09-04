import { useMemo } from "react";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { ageColumn } from "@/modules/k8s/registry/descriptors/columnHelpers";
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
            <CellLink
              to={PATH_K8S_NODE_DETAIL_FULL}
              params={{ clusterName, name: data.metadata?.name ?? "" }}
              text={data.metadata?.name}
            />
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
      ageColumn,
    ],
    [clusterName]
  );
}
