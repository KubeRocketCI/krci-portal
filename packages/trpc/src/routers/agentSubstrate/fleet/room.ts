import type { RoomSize } from "@my-project/shared";
import type { SubstrateWorker } from "../../../clients/agentSubstrate/index.js";

const GIB = 1n << 30n;

/**
 * The largest CPU limit and the largest memory limit, which may come from different templates.
 * Null when no template sets a CPU or memory limit.
 */
export function roomSizeOf(limits: (RoomSize | null)[]): RoomSize | null {
  const size = limits.reduce<RoomSize | null>(
    (largest, limit) =>
      limit
        ? {
            cpuMillicores: Math.max(largest?.cpuMillicores ?? 0, limit.cpuMillicores),
            memoryBytes: Math.max(largest?.memoryBytes ?? 0, limit.memoryBytes),
          }
        : largest,
    null
  );
  return size && (size.cpuMillicores > 0 || size.memoryBytes > 0) ? size : null;
}

function wholeBytes(value: number): bigint {
  return Number.isFinite(value) && value > 0 ? BigInt(Math.trunc(value)) : 0n;
}

/** The per-GiB overhead is rounded down to a byte. */
function bookedMemory(memoryBytes: number, overhead: SubstrateWorker["actorOverhead"]): number {
  if (!overhead) return memoryBytes;
  const perGib = Number((wholeBytes(memoryBytes) * wholeBytes(overhead.memoryBytesPerGib)) / GIB);
  return memoryBytes + overhead.memoryBytes + perGib;
}

function fits(free: number, booked: number): number {
  return booked > 0 ? Math.floor(free / booked) : Infinity;
}

/**
 * Actors of `size` that the worker can still host, as the Agent Substrate scheduler places them: only an active,
 * registered worker hosts actors; each actor takes one of `capacity.actors` and its limits plus the runtime overhead.
 * More allocated than capacity in CPU or memory: no room, as the scheduler compares raw free resources. A dimension
 * with a booking of 0 does not bound room otherwise. `size` null: actors only, runtime overhead not booked.
 * Per-actor constraints (snapshot sandbox class, selectors) are not applied.
 */
export function roomOf(worker: SubstrateWorker, size: RoomSize | null): number {
  if (worker.state !== "active" || !worker.registered) return 0;

  const { capacity, allocated } = worker;
  const freeActors = capacity.actors - allocated.actors;
  if (freeActors <= 0) return 0;
  if (!size) return freeActors;

  const freeCpu = capacity.cpuMillicores - allocated.cpuMillicores;
  const freeMemory = capacity.memoryBytes - allocated.memoryBytes;
  if (freeCpu < 0 || freeMemory < 0) return 0;

  const bookedMemoryBytes = bookedMemory(size.memoryBytes, worker.actorOverhead);
  return Math.min(freeActors, fits(freeCpu, size.cpuMillicores), fits(freeMemory, bookedMemoryBytes));
}
