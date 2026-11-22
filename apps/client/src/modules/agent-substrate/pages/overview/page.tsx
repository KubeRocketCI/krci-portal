import { LayoutDashboard } from "lucide-react";
import { FleetPage } from "../../components/FleetPage";

export default function AgentOverviewPage() {
  return <FleetPage icon={LayoutDashboard} title="Fleet Overview" breadcrumbs={[{ label: "Overview" }]} />;
}
