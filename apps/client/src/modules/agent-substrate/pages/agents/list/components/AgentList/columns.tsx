import type { ActorRow } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import { ActorLink } from "../../../../../components/ActorCells";
import {
  actorStateColumn,
  agentColumn,
  agentProfileColumn,
  codebaseColumn,
  createdColumn,
  modelColumn,
  updatedColumn,
} from "../../../../../components/ActorColumns";

/** Rows are the actors that host an agent: `agent` is set. */
export const agentColumns: TableColumn<ActorRow>[] = [
  // Id `issue`: the saved table settings and `DEFAULT_SORT` of the Agents list use it.
  { ...agentColumn, id: "issue", label: "Issue" },
  codebaseColumn,
  agentProfileColumn,
  modelColumn,
  actorStateColumn,
  createdColumn,
  updatedColumn,
  {
    id: "actor",
    label: "Actor",
    data: { columnSortableValuePath: "name", render: ({ data }) => <ActorLink actor={data} /> },
    cell: { baseWidth: 12 },
  },
];
