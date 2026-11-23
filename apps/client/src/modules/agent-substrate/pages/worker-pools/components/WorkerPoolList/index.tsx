import React from "react";
import type { ReadyFleetSnapshot, WorkerPoolRow } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import type { TableRowAttributes } from "@/core/components/Table/types";
import { TABLE } from "@/k8s/constants/tables";
import { useScrollToHashTarget } from "../../../../hooks/useScrollToHashTarget";
import { HASH_TARGET_CLASS, workerPoolAnchor } from "../../../../utils/rowAnchor";
import { roomSizeLabel } from "../../../../utils/roomLabel";
import { workerPoolColumns } from "./columns";

const DEFAULT_SORT = { sortBy: "name", order: "asc" } as const;

const EMPTY_LIST = <EmptyList customText="No worker pools" />;

/** The row that the URL fragment names sorts first under every sort and is highlighted. */
export function WorkerPoolList({ fleet }: { fleet: ReadyFleetSnapshot }) {
  const { items, roomSize } = fleet.workerPools;
  const target = useScrollToHashTarget(items);

  const isTarget = React.useCallback((row: WorkerPoolRow) => workerPoolAnchor(row) === target, [target]);

  const rowProps = React.useCallback(
    (row: WorkerPoolRow): TableRowAttributes => ({
      id: workerPoolAnchor(row),
      ...(isTarget(row) && { className: HASH_TARGET_CLASS, "aria-current": "true" }),
    }),
    [isTarget]
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">Room is counted {roomSizeLabel(roomSize)}.</p>
      <DataTable<WorkerPoolRow>
        id={TABLE.AGENT_WORKER_POOL_LIST.id}
        name={TABLE.AGENT_WORKER_POOL_LIST.name}
        data={items}
        columns={workerPoolColumns}
        sort={DEFAULT_SORT}
        isRowPinned={isTarget}
        rowProps={rowProps}
        emptyListComponent={EMPTY_LIST}
      />
    </div>
  );
}
