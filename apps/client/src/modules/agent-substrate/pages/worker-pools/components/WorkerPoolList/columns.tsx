import type { WorkerPoolRow } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { EmptyValue, TextOrEmpty } from "../../../../components/EmptyValue";
import { WorkerPoolReadyBadge } from "../../../../components/WorkerCells";

export const workerPoolColumns: TableColumn<WorkerPoolRow>[] = [
  {
    id: "name",
    label: "Name",
    data: { columnSortableValuePath: "name", render: ({ data }) => <TextWithTooltip text={data.name} /> },
    cell: { baseWidth: 14 },
  },
  {
    id: "namespace",
    label: "Namespace",
    data: { columnSortableValuePath: "namespace", render: ({ data }) => <TextWithTooltip text={data.namespace} /> },
    cell: { baseWidth: 12 },
  },
  {
    id: "ready",
    label: "Ready",
    data: {
      columnSortableValuePath: ["resource", "readyReplicas"],
      render: ({ data }) => (data.resource ? <WorkerPoolReadyBadge resource={data.resource} /> : <EmptyValue />),
    },
    cell: { baseWidth: 8 },
  },
  {
    id: "desired",
    label: "Desired",
    data: {
      columnSortableValuePath: ["resource", "desiredReplicas"],
      render: ({ data }) => data.resource?.desiredReplicas ?? <EmptyValue />,
    },
    cell: { baseWidth: 6 },
  },
  {
    id: "sandboxClass",
    label: "Sandbox class",
    data: {
      columnSortableValuePath: ["resource", "sandboxClass"],
      render: ({ data }) => <TextOrEmpty text={data.resource?.sandboxClass} />,
    },
    cell: { baseWidth: 9 },
  },
  {
    id: "resolution",
    label: "Resolution",
    data: {
      columnSortableValuePath: ["resource", "resolution"],
      render: ({ data }) => <TextOrEmpty text={data.resource?.resolution} />,
    },
    cell: { baseWidth: 9 },
  },
  {
    id: "workers",
    label: "Workers",
    data: { columnSortableValue: (row) => row.workers.length, render: ({ data }) => data.workers.length },
    cell: { baseWidth: 6 },
  },
  {
    id: "room",
    label: "Room",
    data: { columnSortableValuePath: "room", render: ({ data }) => data.room },
    cell: { baseWidth: 6 },
  },
];
