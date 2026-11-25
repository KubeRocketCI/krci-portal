import React from "react";
import { useRouterState } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import type { ActorRow } from "@my-project/shared";
import { FilterProvider } from "@/core/providers/Filter";
import { FleetPage } from "../../../components/FleetPage";
import { FleetEmpty } from "../../../components/FleetStatePanel";
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import { withRawSearchValues } from "../../../utils/fleetFilter";
import { agentFilterDefaultValues, agentMatchFunctions } from "./components/AgentFilter/constants";
import type { AgentFilterValues } from "./components/AgentFilter/types";
import { AgentList } from "./components/AgentList";

export default function FactoryAgentsPage() {
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const normalizeUrlValues = React.useMemo(() => withRawSearchValues<AgentFilterValues>(searchStr), [searchStr]);

  return (
    <FilterProvider<ActorRow, AgentFilterValues>
      defaultValues={agentFilterDefaultValues}
      matchFunctions={agentMatchFunctions}
      normalizeUrlValues={normalizeUrlValues}
      syncWithUrl
    >
      <FleetPage icon={Bot} title="Agents" description={PAGE_DESCRIPTION.agents} breadcrumbs={[{ label: "Agents" }]}>
        {(fleet) => (fleet.atespaces.length === 0 ? <FleetEmpty /> : <AgentList fleet={fleet} />)}
      </FleetPage>
    </FilterProvider>
  );
}
