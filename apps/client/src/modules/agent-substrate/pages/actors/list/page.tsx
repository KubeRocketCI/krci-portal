import { Bot } from "lucide-react";
import { FleetPage } from "../../../components/FleetPage";

export default function AgentActorsPage() {
  return <FleetPage icon={Bot} title="Actors" breadcrumbs={[{ label: "Actors" }]} />;
}
