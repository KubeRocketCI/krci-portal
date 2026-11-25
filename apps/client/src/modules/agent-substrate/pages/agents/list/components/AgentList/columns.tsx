import type { ActorRow } from "@my-project/shared";
import type { TableColumn } from "@/core/components/Table/types";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { ActorLink } from "../../../../../components/ActorCells";
import {
  actorStateColumn,
  agentProfileColumn,
  codebaseColumn,
  createdColumn,
  modelColumn,
  updatedColumn,
} from "../../../../../components/ActorColumns";
import { EmptyValue } from "../../../../../components/EmptyValue";
import { PATH_FACTORY_AGENT_DETAIL_FULL } from "../../../../../constants/paths";
import { issueLabel } from "../../../../../utils/issueLabel";
import { stopRowClick } from "../../../../../utils/stopRowClick";

/** Rows are the actors that host an agent: `agent` is set. */
export const agentColumns = (clusterName: string): TableColumn<ActorRow>[] => [
  {
    id: "issue",
    label: "Issue",
    data: {
      columnSortableValue: (row) => (row.agent ? issueLabel(row.agent.issue) : ""),
      render: ({ data }) =>
        data.agent ? (
          <CellLink
            to={PATH_FACTORY_AGENT_DETAIL_FULL}
            params={{ clusterName, atespace: data.atespace, name: data.name }}
            text={issueLabel(data.agent.issue)}
            onClick={stopRowClick}
          />
        ) : (
          <EmptyValue />
        ),
    },
    cell: { baseWidth: 14 },
  },
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
