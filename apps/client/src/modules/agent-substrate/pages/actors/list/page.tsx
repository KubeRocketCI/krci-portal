import React from "react";
import { useRouterState } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import type { ActorRow } from "@my-project/shared";
import { FilterProvider } from "@/core/providers/Filter";
import { FleetPage } from "../../../components/FleetPage";
import { FleetEmpty } from "../../../components/FleetStatePanel";
import { actorFilterDefaultValues, actorMatchFunctions, withRawSearchValues } from "./components/ActorFilter/constants";
import type { ActorFilterValues } from "./components/ActorFilter/types";
import { ActorList } from "./components/ActorList";

export default function AgentActorsPage() {
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const normalizeUrlValues = React.useMemo(() => withRawSearchValues(searchStr), [searchStr]);

  return (
    <FilterProvider<ActorRow, ActorFilterValues>
      defaultValues={actorFilterDefaultValues}
      matchFunctions={actorMatchFunctions}
      normalizeUrlValues={normalizeUrlValues}
      syncWithUrl
    >
      <FleetPage icon={Bot} title="Actors" breadcrumbs={[{ label: "Actors" }]}>
        {(fleet) => (fleet.atespaces.length === 0 ? <FleetEmpty /> : <ActorList fleet={fleet} />)}
      </FleetPage>
    </FilterProvider>
  );
}
