import { useMemo } from "react";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { ageColumn, namespaceColumn } from "@/modules/k8s/registry/descriptors/columnHelpers";
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
            <CellLink
              to={PATH_K8S_POD_DETAIL_FULL}
              params={{
                clusterName,
                namespace: data.metadata?.namespace ?? "",
                name: data.metadata?.name ?? "",
              }}
              text={data.metadata?.name}
            />
          ),
          columnSortableValuePath: "metadata.name",
        },
        cell: { baseWidth: 20 },
      },
      { ...namespaceColumn, cell: { ...namespaceColumn.cell, baseWidth: 12 } },
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
      ageColumn,
    ],
    [clusterName]
  );
}
