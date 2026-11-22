import { LayoutDashboard } from "lucide-react";
import { FleetCounts } from "../../components/FleetCounts";
import { FleetPage } from "../../components/FleetPage";
import { FleetEmpty } from "../../components/FleetStatePanel";

export default function AgentOverviewPage() {
  return (
    <FleetPage icon={LayoutDashboard} title="Fleet Overview" breadcrumbs={[{ label: "Overview" }]}>
      {(fleet) => (fleet.atespaces.length === 0 ? <FleetEmpty /> : <FleetCounts summary={fleet.summary} />)}
    </FleetPage>
  );
}
