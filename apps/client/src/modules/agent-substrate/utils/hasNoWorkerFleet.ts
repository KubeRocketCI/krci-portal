import type { ReadyFleet } from "@my-project/shared";

/** No atespace, no worker pool and a readable WorkerPool list: the empty fleet panel. */
export function hasNoWorkerFleet(fleet: ReadyFleet): boolean {
  return fleet.atespaces.length === 0 && fleet.workerPools.items.length === 0 && fleet.workerPools.access === "ok";
}
