import { latestSnapshot, type ActorRow } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { ActorLink, AgentIssueLink, SnapshotFidelityDurability } from "../../../../../components/ActorCells";
import {
  actorStateColumn,
  agentProfileColumn,
  codebaseColumn,
  createdColumn,
  modelColumn,
  updatedColumn,
} from "../../../../../components/ActorColumns";
import { TextOrEmpty } from "../../../../../components/EmptyValue";
import { TERM_HINT } from "../../../../../constants/hints";
import { issueLabel } from "../../../../../utils/issueLabel";
import { placementWorkerPool } from "../../../../../utils/roomLabel";

export const actorColumns: TableColumn<ActorRow>[] = [
  {
    id: "name",
    label: "Name",
    data: { columnSortableValuePath: "name", render: ({ data }) => <ActorLink actor={data} /> },
    cell: { baseWidth: 12 },
  },
  {
    id: "atespace",
    label: "Atespace",
    hint: TERM_HINT.atespace,
    data: { columnSortableValuePath: "atespace", render: ({ data }) => <TextWithTooltip text={data.atespace} /> },
    cell: { baseWidth: 9 },
  },
  {
    id: "issue",
    label: "Issue",
    data: {
      columnSortableValue: (row) => (row.agent ? issueLabel(row.agent.issue) : ""),
      render: ({ data }) => <AgentIssueLink agent={data.agent} />,
    },
    cell: { baseWidth: 14 },
  },
  codebaseColumn,
  agentProfileColumn,
  modelColumn,
  actorStateColumn,
  {
    id: "workerPool",
    label: "Worker pool",
    hint: TERM_HINT.workerPool,
    data: {
      columnSortableValue: ({ placement }) => placementWorkerPool(placement) ?? "",
      render: ({ data }) => <TextOrEmpty text={placementWorkerPool(data.placement)} />,
    },
    cell: { baseWidth: 9 },
  },
  {
    id: "pod",
    label: "Worker pod",
    data: {
      columnSortableValuePath: ["placement", "workerPod"],
      render: ({ data }) => <TextWithTooltip text={data.placement?.workerPod} />,
    },
    cell: { baseWidth: 9, show: false },
  },
  {
    id: "node",
    label: "Node",
    data: {
      columnSortableValuePath: ["placement", "node"],
      render: ({ data }) => <TextWithTooltip text={data.placement?.node} />,
    },
    cell: { baseWidth: 8 },
  },
  createdColumn,
  updatedColumn,
  {
    id: "snapshot",
    label: "Snapshot",
    data: { render: ({ data }) => <SnapshotFidelityDurability snapshot={latestSnapshot(data.snapshots)} /> },
    cell: { baseWidth: 10 },
  },
];
