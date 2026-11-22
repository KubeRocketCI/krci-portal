import { Boxes } from "lucide-react";
import { FleetPage } from "../../components/FleetPage";

export default function AgentWorkerPoolsPage() {
  return <FleetPage icon={Boxes} title="Worker pools" breadcrumbs={[{ label: "Worker pools" }]} />;
}
