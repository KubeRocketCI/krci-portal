import { Server } from "lucide-react";
import { FleetPage } from "../../components/FleetPage";

export default function AgentWorkersPage() {
  return <FleetPage icon={Server} title="Workers" breadcrumbs={[{ label: "Workers" }]} />;
}
