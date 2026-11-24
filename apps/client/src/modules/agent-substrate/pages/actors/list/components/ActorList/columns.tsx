import { latestSnapshot, type ActorRow } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { formatTimestamp } from "@/core/utils/date-humanize";
import {
  ActorLink,
  ActorStateBadge,
  AgentCodebaseLink,
  AgentIssueLink,
  SnapshotFidelityDurability,
} from "../../../../../components/ActorCells";
import { issueLabel } from "../../../../../utils/issueLabel";

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
  {
    id: "codebase",
    label: "Codebase",
    data: {
      columnSortableValue: (row) => row.agent?.codebase?.name ?? row.agent?.issue.projectPath ?? "",
      render: ({ data }) => <AgentCodebaseLink agent={data.agent} />,
    },
    cell: { baseWidth: 11 },
  },
  {
    id: "agentProfile",
    label: "Agent profile",
    data: {
      columnSortableValuePath: ["agent", "agentProfile"],
      render: ({ data }) => <TextWithTooltip text={data.agent?.agentProfile} />,
    },
    cell: { baseWidth: 7 },
  },
  {
    id: "model",
    label: "Model",
    data: {
      columnSortableValuePath: ["agent", "model"],
      render: ({ data }) => <TextWithTooltip text={data.agent?.model} />,
    },
    cell: { baseWidth: 9 },
  },
  {
    id: "state",
    label: "Actor state",
    data: { columnSortableValuePath: "state", render: ({ data }) => <ActorStateBadge state={data.state} /> },
    cell: { baseWidth: 7 },
  },
  {
    id: "pod",
    label: "Worker pod",
    data: {
      columnSortableValuePath: ["placement", "pod"],
      render: ({ data }) => <TextWithTooltip text={data.placement?.pod} />,
    },
    cell: { baseWidth: 9 },
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
  {
    id: "created",
    label: "Created",
    data: { columnSortableValuePath: "createdAt", render: ({ data }) => formatTimestamp(data.createdAt) },
    cell: { baseWidth: 9 },
  },
  {
    id: "updated",
    label: "Last change",
    data: { columnSortableValuePath: "updatedAt", render: ({ data }) => formatTimestamp(data.updatedAt) },
    cell: { baseWidth: 9 },
  },
  {
    id: "snapshot",
    label: "Snapshot",
    data: { render: ({ data }) => <SnapshotFidelityDurability snapshot={latestSnapshot(data.snapshots)} /> },
    cell: { baseWidth: 10 },
  },
];
