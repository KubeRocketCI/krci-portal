import { Boxes } from "lucide-react";
import { FleetPage } from "../../components/FleetPage";
import { FleetEmpty } from "../../components/FleetStatePanel";
import { WorkerPoolAccessNotice } from "../../components/WorkerPoolAccessNotice";
import { hasNoWorkerFleet } from "../../utils/hasNoWorkerFleet";
import { WorkerPoolList } from "./components/WorkerPoolList";

export default function AgentWorkerPoolsPage() {
  return (
    <FleetPage icon={Boxes} title="Worker pools" breadcrumbs={[{ label: "Worker pools" }]}>
      {(fleet) =>
        hasNoWorkerFleet(fleet) ? (
          <FleetEmpty />
        ) : (
          <>
            <WorkerPoolAccessNotice access={fleet.workerPools.access} />
            <WorkerPoolList fleet={fleet} />
          </>
        )
      }
    </FleetPage>
  );
}
