import { LayoutDashboard } from "lucide-react";
import { SectionHeading } from "@/core/components/SectionHeading";
import { FleetCounts } from "../../components/FleetCounts";
import { FleetPage } from "../../components/FleetPage";
import { FleetEmpty } from "../../components/FleetStatePanel";
import { NeedsAttention } from "./components/NeedsAttention";

/** Needs attention is rendered also with no atespace. */
export default function AgentOverviewPage() {
  return (
    <FleetPage icon={LayoutDashboard} title="Fleet Overview" breadcrumbs={[{ label: "Overview" }]}>
      {(fleet) => (
        <>
          <NeedsAttention fleet={fleet} />
          {fleet.atespaces.length === 0 ? (
            <FleetEmpty />
          ) : (
            <div>
              <SectionHeading>Actors</SectionHeading>
              <FleetCounts summary={fleet.summary} />
            </div>
          )}
        </>
      )}
    </FleetPage>
  );
}
