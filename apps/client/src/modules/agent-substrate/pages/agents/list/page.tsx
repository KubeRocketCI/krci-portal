import React from "react";
import { useRouterState } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import type { ActorRow, ReadyFleet } from "@my-project/shared";
import { FilterProvider } from "@/core/providers/Filter";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { FleetPage } from "../../../components/FleetPage";
import { FleetEmpty } from "../../../components/FleetStatePanel";
import { ViewToggle } from "../../../components/ViewToggle";
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import { agentRows, withRawSearchValues } from "../../../utils/fleetFilter";
import { AgentCodebaseGroups } from "./components/AgentCodebaseGroups";
import { agentFilterDefaultValues, agentMatchFunctions } from "./components/AgentFilter/constants";
import type { AgentFilterValues } from "./components/AgentFilter/types";
import { AgentList } from "./components/AgentList";
import { AGENTS_VIEW_ENTITY_ID, AGENTS_VIEW_OPTIONS } from "./constants";
import { agentsView, type AgentsView } from "./utils/view";

function Agents({ fleet }: { fleet: ReadyFleet }) {
  const { viewMode, handleChangeViewMode } = useViewModeContext();
  const view = agentsView(viewMode);
  const agents = React.useMemo(() => agentRows(fleet.actors), [fleet.actors]);

  return (
    <>
      <ViewToggle<AgentsView> view={view} options={AGENTS_VIEW_OPTIONS} onChange={handleChangeViewMode} />
      {view === VIEW_MODES.GRID ? <AgentCodebaseGroups agents={agents} /> : <AgentList agents={agents} />}
    </>
  );
}

export default function FactoryAgentsPage() {
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const normalizeUrlValues = React.useMemo(() => withRawSearchValues<AgentFilterValues>(searchStr), [searchStr]);

  return (
    <ViewModeContextProvider entityID={AGENTS_VIEW_ENTITY_ID} defaultViewMode={VIEW_MODES.TABLE}>
      <FilterProvider<ActorRow, AgentFilterValues>
        defaultValues={agentFilterDefaultValues}
        matchFunctions={agentMatchFunctions}
        normalizeUrlValues={normalizeUrlValues}
        syncWithUrl
      >
        <FleetPage icon={Bot} title="Agents" description={PAGE_DESCRIPTION.agents} breadcrumbs={[{ label: "Agents" }]}>
          {(fleet) => (fleet.atespaces.length === 0 ? <FleetEmpty /> : <Agents fleet={fleet} />)}
        </FleetPage>
      </FilterProvider>
    </ViewModeContextProvider>
  );
}
