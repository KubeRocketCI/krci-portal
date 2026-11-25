import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import type { ActorRow, ReadyFleet } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { useFilterContext } from "@/core/providers/Filter";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { PATH_FACTORY_AGENT_DETAIL_FULL } from "../../../../../constants/paths";
import { agentRows } from "../../../../../utils/fleetFilter";
import { AgentFilter } from "../AgentFilter";
import type { AgentFilterValues } from "../AgentFilter/types";
import { agentColumns } from "./columns";

const DEFAULT_SORT = { sortBy: "issue", order: "asc" } as const;

const EMPTY_LIST = <EmptyList customText="No agents" />;

export function AgentList({ fleet }: { fleet: ReadyFleet }) {
  const { filterFunction } = useFilterContext<ActorRow, AgentFilterValues>();
  const navigate = useNavigate();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const agents = React.useMemo(() => agentRows(fleet.actors), [fleet.actors]);

  const slots = React.useMemo(() => ({ header: { component: <AgentFilter agents={agents} /> } }), [agents]);

  const handleRowClick = React.useCallback(
    (_event: React.MouseEvent<HTMLTableRowElement>, actor: ActorRow) => {
      void navigate({
        to: PATH_FACTORY_AGENT_DETAIL_FULL,
        params: { clusterName, atespace: actor.atespace, name: actor.name },
      });
    },
    [navigate, clusterName]
  );

  return (
    <DataTable<ActorRow>
      id={TABLE.AGENT_LIST.id}
      name={TABLE.AGENT_LIST.name}
      data={agents}
      columns={agentColumns}
      sort={DEFAULT_SORT}
      filterFunction={filterFunction}
      handleRowClick={handleRowClick}
      emptyListComponent={EMPTY_LIST}
      slots={slots}
    />
  );
}
