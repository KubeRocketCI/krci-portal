import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import type { ReadyFleet } from "@my-project/shared";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { FleetPage } from "../../components/FleetPage";
import { FleetEmpty } from "../../components/FleetStatePanel";
import { ViewToggle } from "../../components/ViewToggle";
import { WorkerPoolAccessNotice } from "../../components/WorkerPoolAccessNotice";
import { PAGE_DESCRIPTION } from "../../constants/hints";
import { hasNoWorkerFleet } from "../../utils/hasNoWorkerFleet";
import { isWorkerAnchor } from "../../utils/rowAnchor";
import { WorkerPoolCards } from "./components/WorkerPoolCards";
import { WorkerPoolTable } from "./components/WorkerPoolTable";
import { WORKER_POOLS_VIEW_ENTITY_ID, WORKER_POOLS_VIEW_OPTIONS, workerPoolsSearchSchema } from "./constants";
import { workerPoolsView, type WorkerPoolsView } from "./utils/view";

function WorkerPools({ fleet }: { fleet: ReadyFleet }) {
  const { viewMode, handleChangeViewMode } = useViewModeContext();
  const { hash, search } = useRouterState({ select: (state) => state.location });
  const requested = workerPoolsSearchSchema.parse(search).view;
  const navigate = useNavigate();
  const view = workerPoolsView(viewMode, hash, requested);

  /** A chosen view drops a worker hash and the `view` param. */
  const onViewChange = (next: WorkerPoolsView) => {
    handleChangeViewMode(next);
    const workerHash = isWorkerAnchor(hash);
    if (!workerHash && !requested) return;
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, view: undefined }),
      hash: workerHash ? "" : true,
      replace: true,
    });
  };

  if (hasNoWorkerFleet(fleet)) return <FleetEmpty />;

  return (
    <>
      <WorkerPoolAccessNotice access={fleet.workerPools.access} />
      <ViewToggle<WorkerPoolsView> view={view} options={WORKER_POOLS_VIEW_OPTIONS} onChange={onViewChange} />
      {view === VIEW_MODES.TABLE ? <WorkerPoolTable fleet={fleet} /> : <WorkerPoolCards fleet={fleet} />}
    </>
  );
}

export default function FactoryWorkerPoolsPage() {
  return (
    <ViewModeContextProvider entityID={WORKER_POOLS_VIEW_ENTITY_ID} defaultViewMode={VIEW_MODES.GRID}>
      <FleetPage
        icon={Boxes}
        title="Worker pools"
        description={PAGE_DESCRIPTION.workerPools}
        breadcrumbs={[{ label: "Worker pools" }]}
      >
        {(fleet) => <WorkerPools fleet={fleet} />}
      </FleetPage>
    </ViewModeContextProvider>
  );
}
