import { LayoutDashboard } from "lucide-react";
import { FleetPage } from "../../components/FleetPage";
import { FleetEmpty } from "../../components/FleetStatePanel";
import { AtAGlance } from "./components/AtAGlance";
import { NeedsAttention } from "./components/NeedsAttention";

/** Needs attention and At a glance are rendered also with no atespace. */
export default function AgentOverviewPage() {
  return (
    <FleetPage icon={LayoutDashboard} title="Fleet Overview" breadcrumbs={[{ label: "Overview" }]}>
      {(fleet) => (
        <>
          <NeedsAttention fleet={fleet} />
          <AtAGlance fleet={fleet} />
          {fleet.atespaces.length === 0 && <FleetEmpty />}
        </>
      )}
    </FleetPage>
  );
}
