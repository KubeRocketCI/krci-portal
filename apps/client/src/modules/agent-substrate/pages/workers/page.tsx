import { Server } from "lucide-react";
import { FleetPage } from "../../components/FleetPage";
import { CapacityBoard } from "./components/CapacityBoard";

export default function AgentWorkersPage() {
  return (
    <FleetPage icon={Server} title="Workers" breadcrumbs={[{ label: "Workers" }]}>
      {(fleet) => <CapacityBoard fleet={fleet} />}
    </FleetPage>
  );
}
