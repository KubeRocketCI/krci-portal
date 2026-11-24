import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import type { ActorRow, ReadyFleet } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { useFilterContext } from "@/core/providers/Filter";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { PATH_AGENT_ACTOR_DETAIL_FULL } from "../../../../../constants/paths";
import { ActorFilter } from "../ActorFilter";
import type { ActorFilterValues } from "../ActorFilter/types";
import { actorColumns } from "./columns";

const DEFAULT_SORT = { sortBy: "name", order: "asc" } as const;

const EMPTY_LIST = <EmptyList customText="No actors" />;

export function ActorList({ fleet }: { fleet: ReadyFleet }) {
  const { filterFunction } = useFilterContext<ActorRow, ActorFilterValues>();
  const navigate = useNavigate();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const slots = React.useMemo(
    () => ({ header: { component: <ActorFilter atespaces={fleet.atespaces} actors={fleet.actors} /> } }),
    [fleet.atespaces, fleet.actors]
  );

  const handleRowClick = React.useCallback(
    (_event: React.MouseEvent<HTMLTableRowElement>, actor: ActorRow) => {
      void navigate({
        to: PATH_AGENT_ACTOR_DETAIL_FULL,
        params: { clusterName, atespace: actor.atespace, name: actor.name },
      });
    },
    [navigate, clusterName]
  );

  return (
    <DataTable<ActorRow>
      id={TABLE.AGENT_ACTOR_LIST.id}
      name={TABLE.AGENT_ACTOR_LIST.name}
      data={fleet.actors}
      columns={actorColumns}
      sort={DEFAULT_SORT}
      filterFunction={filterFunction}
      handleRowClick={handleRowClick}
      emptyListComponent={EMPTY_LIST}
      slots={slots}
    />
  );
}
