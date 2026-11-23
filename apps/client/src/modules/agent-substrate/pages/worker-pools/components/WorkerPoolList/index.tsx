import type { ReadyFleetSnapshot, WorkerPoolRow } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { roomSizeLabel } from "../../../../utils/roomLabel";
import { workerPoolColumns } from "./columns";

const DEFAULT_SORT = { sortBy: "name", order: "asc" } as const;

const EMPTY_LIST = <EmptyList customText="No worker pools" />;

export function WorkerPoolList({ fleet }: { fleet: ReadyFleetSnapshot }) {
  const { items, roomSize } = fleet.workerPools;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">Room is counted {roomSizeLabel(roomSize)}.</p>
      <DataTable<WorkerPoolRow>
        id={TABLE.AGENT_WORKER_POOL_LIST.id}
        name={TABLE.AGENT_WORKER_POOL_LIST.name}
        data={items}
        columns={workerPoolColumns}
        sort={DEFAULT_SORT}
        emptyListComponent={EMPTY_LIST}
      />
    </div>
  );
}
