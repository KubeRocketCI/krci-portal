import type { ReadyFleetSnapshot } from "@my-project/shared";

/** No atespace, no worker pool and a readable WorkerPool list: the empty fleet panel. */
export function hasNoWorkerFleet(fleet: ReadyFleetSnapshot): boolean {
  return fleet.atespaces.length === 0 && fleet.workerPools.items.length === 0 && fleet.workerPools.access === "ok";
}
