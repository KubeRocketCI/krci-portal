import { Bot } from "lucide-react";
import type { ActorRow } from "@my-project/shared";
import { FilterProvider } from "@/core/providers/Filter";
import { FleetPage } from "../../../components/FleetPage";
import { FleetEmpty } from "../../../components/FleetStatePanel";
import { actorFilterDefaultValues, actorMatchFunctions } from "./components/ActorFilter/constants";
import type { ActorFilterValues } from "./components/ActorFilter/types";
import { ActorList } from "./components/ActorList";

export default function AgentActorsPage() {
  return (
    <FilterProvider<ActorRow, ActorFilterValues>
      defaultValues={actorFilterDefaultValues}
      matchFunctions={actorMatchFunctions}
      syncWithUrl
    >
      <FleetPage icon={Bot} title="Actors" breadcrumbs={[{ label: "Actors" }]}>
        {(fleet) => (fleet.atespaces.length === 0 ? <FleetEmpty /> : <ActorList fleet={fleet} />)}
      </FleetPage>
    </FilterProvider>
  );
}
