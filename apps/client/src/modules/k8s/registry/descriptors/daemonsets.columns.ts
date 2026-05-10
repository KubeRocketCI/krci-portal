import type { RenderName } from "./columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import { makeNameColumn, namespaceColumn, ageColumn } from "./columnHelpers";

export const daemonSetColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "desired",
    label: "Desired",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { desiredNumberScheduled?: number } };
        return String(s.status?.desiredNumberScheduled ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "current",
    label: "Current",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { currentNumberScheduled?: number } };
        return String(s.status?.currentNumberScheduled ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "ready",
    label: "Ready",
    data: {
      render: ({ data }) => {
        const s = data as { status?: { numberReady?: number } };
        return String(s.status?.numberReady ?? 0);
      },
    },
    cell: { baseWidth: 10 },
  },
  ageColumn,
];
