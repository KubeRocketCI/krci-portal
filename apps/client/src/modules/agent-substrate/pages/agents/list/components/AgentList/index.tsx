import React from "react";
import type { ActorRow } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { useFilterContext } from "@/core/providers/Filter";
import { TABLE } from "@/k8s/constants/tables";
import { AGENT_TABLE_SORT, AGENTS_EMPTY_TEXT } from "../../constants";
import { useAgentRowClick } from "../../hooks/useAgentRowClick";
import { AgentFilter } from "../AgentFilter";
import type { AgentFilterValues } from "../AgentFilter/types";
import { agentColumns } from "./columns";

const EMPTY_LIST = <EmptyList customText={AGENTS_EMPTY_TEXT} />;

/** `agents`: the actors that host an agent. */
export function AgentList({ agents }: { agents: ActorRow[] }) {
  const { filterFunction } = useFilterContext<ActorRow, AgentFilterValues>();
  const handleRowClick = useAgentRowClick();

  const slots = React.useMemo(() => ({ header: { component: <AgentFilter agents={agents} /> } }), [agents]);

  return (
    <DataTable<ActorRow>
      id={TABLE.AGENT_LIST.id}
      name={TABLE.AGENT_LIST.name}
      data={agents}
      columns={agentColumns}
      sort={AGENT_TABLE_SORT}
      filterFunction={filterFunction}
      handleRowClick={handleRowClick}
      emptyListComponent={EMPTY_LIST}
      slots={slots}
    />
  );
}
