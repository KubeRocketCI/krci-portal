import type { ActorRow } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { TERM_HINT } from "../../constants/hints";
import { ActorStateBadge, AgentCodebaseLink } from "../ActorCells";

export const codebaseColumn: TableColumn<ActorRow> = {
  id: "codebase",
  label: "Codebase",
  data: {
    columnSortableValue: (row) => row.agent?.codebase?.name ?? row.agent?.issue.projectPath ?? "",
    render: ({ data }) => <AgentCodebaseLink agent={data.agent} />,
  },
  cell: { baseWidth: 11 },
};

export const agentProfileColumn: TableColumn<ActorRow> = {
  id: "agentProfile",
  label: "Agent profile",
  hint: TERM_HINT.agentProfile,
  data: {
    columnSortableValuePath: ["agent", "agentProfile"],
    render: ({ data }) => <TextWithTooltip text={data.agent?.agentProfile} />,
  },
  cell: { baseWidth: 7 },
};

export const modelColumn: TableColumn<ActorRow> = {
  id: "model",
  label: "Model",
  data: {
    columnSortableValuePath: ["agent", "model"],
    render: ({ data }) => <TextWithTooltip text={data.agent?.model} />,
  },
  cell: { baseWidth: 9 },
};

export const actorStateColumn: TableColumn<ActorRow> = {
  id: "state",
  label: "Actor state",
  hint: TERM_HINT.actorState,
  data: { columnSortableValuePath: "state", render: ({ data }) => <ActorStateBadge state={data.state} /> },
  cell: { baseWidth: 7 },
};

export const createdColumn: TableColumn<ActorRow> = {
  id: "created",
  label: "Created",
  data: { columnSortableValuePath: "createdAt", render: ({ data }) => formatTimestamp(data.createdAt) },
  cell: { baseWidth: 9 },
};

export const updatedColumn: TableColumn<ActorRow> = {
  id: "updated",
  label: "Last change",
  data: { columnSortableValuePath: "updatedAt", render: ({ data }) => formatTimestamp(data.updatedAt) },
  cell: { baseWidth: 9 },
};
