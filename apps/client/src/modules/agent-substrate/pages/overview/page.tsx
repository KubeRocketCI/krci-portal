import { LayoutDashboard } from "lucide-react";
import { FleetPage } from "../../components/FleetPage";
import { FleetEmpty } from "../../components/FleetStatePanel";
import { AtAGlance } from "./components/AtAGlance";
import { Capacity } from "./components/Capacity";
import { NeedsAttention } from "./components/NeedsAttention";

/** Needs attention, At a glance and Capacity are rendered also with no atespace. */
export default function AgentOverviewPage() {
  return (
    <FleetPage icon={LayoutDashboard} title="Fleet Overview" breadcrumbs={[{ label: "Overview" }]}>
      {(fleet) => (
        <>
          <NeedsAttention fleet={fleet} />
          <AtAGlance fleet={fleet} />
          <Capacity fleet={fleet} />
          {fleet.atespaces.length === 0 && <FleetEmpty />}
        </>
      )}
    </FleetPage>
  );
}
