import { roomStateSchema, type WorkerPoolRow } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { EmptyValue, TextOrEmpty } from "../../../../components/EmptyValue";
import { RoomVerdictCell } from "../../../../components/RoomVerdict";
import { WorkerPoolReadyBadge } from "../../../../components/WorkerCells";
import { TERM_HINT } from "../../../../constants/hints";
import { labelsText, roomSizeText, roomStateOf } from "../../../../utils/roomLabel";

const roomStateRank = (row: WorkerPoolRow) => {
  const roomState = roomStateOf(row);
  return roomState === null ? roomStateSchema.options.length : roomStateSchema.options.indexOf(roomState);
};

/** `totalRoom`: fleet-wide room; the room state tone depends on it. */
export const workerPoolColumns = (totalRoom: number): TableColumn<WorkerPoolRow>[] => [
  {
    id: "name",
    label: "Name",
    data: { columnSortableValuePath: "name", render: ({ data }) => <TextWithTooltip text={data.name} /> },
    cell: { baseWidth: 12 },
  },
  {
    id: "namespace",
    label: "Namespace",
    data: { columnSortableValuePath: "namespace", render: ({ data }) => <TextWithTooltip text={data.namespace} /> },
    cell: { baseWidth: 10 },
  },
  {
    id: "ready",
    label: "Ready",
    hint: TERM_HINT.replicas,
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
    cell: { baseWidth: 8 },
  },
  {
    id: "resolution",
    label: "Resolution",
    data: {
      columnSortableValuePath: ["resource", "resolution"],
      render: ({ data }) => <TextOrEmpty text={data.resource?.resolution} />,
    },
    cell: { baseWidth: 8 },
  },
  {
    id: "workerLabels",
    label: "Worker labels",
    hint: TERM_HINT.workerLabels,
    data: {
      columnSortableValue: (row) => labelsText(row.workerLabels) ?? "",
      render: ({ data }) => <TextOrEmpty text={labelsText(data.workerLabels)} />,
    },
    cell: { baseWidth: 11 },
  },
  {
    id: "workers",
    label: "Workers",
    data: { columnSortableValue: (row) => row.workers.length, render: ({ data }) => data.workers.length },
    cell: { baseWidth: 6 },
  },
  {
    id: "roomSize",
    label: "Room size",
    hint: TERM_HINT.roomSize,
    data: {
      customSortFn: (a, b) =>
        (a.roomSize?.cpuMillicores ?? -1) - (b.roomSize?.cpuMillicores ?? -1) ||
        (a.roomSize?.memoryBytes ?? -1) - (b.roomSize?.memoryBytes ?? -1),
      render: ({ data }) => <TextOrEmpty text={roomSizeText(data)} />,
    },
    cell: { baseWidth: 9 },
  },
  {
    id: "room",
    label: "Room",
    hint: TERM_HINT.room,
    data: {
      customSortFn: (a, b) => a.room - b.room || roomStateRank(a) - roomStateRank(b),
      render: ({ data }) => <RoomVerdictCell workerPool={data} totalRoom={totalRoom} />,
    },
    cell: { baseWidth: 16 },
  },
];
