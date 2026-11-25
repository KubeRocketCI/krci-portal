import { LayoutDashboard } from "lucide-react";
import { FleetPage } from "../../components/FleetPage";
import { FleetEmpty } from "../../components/FleetStatePanel";
import { PAGE_DESCRIPTION } from "../../constants/hints";
import { AtAGlance } from "./components/AtAGlance";
import { Capacity } from "./components/Capacity";
import { NeedsAttention } from "./components/NeedsAttention";

/** Needs attention, At a glance and Capacity are rendered also with no atespace. */
export default function FactoryOverviewPage() {
  return (
    <FleetPage
      icon={LayoutDashboard}
      title="Fleet Overview"
      description={PAGE_DESCRIPTION.overview}
      breadcrumbs={[{ label: "Overview" }]}
    >
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
