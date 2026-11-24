import {
  roomResourceSchema,
  type RoomResource,
  type RoomSize,
  type RoomState,
  type SubstrateResources,
} from "@my-project/shared";
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

/** More allocated than capacity: 0, as the scheduler compares raw free resources. A booking of 0: no bound. */
function fits(free: number, booked: number): number {
  if (free < 0) return 0;
  return booked > 0 ? Math.floor(free / booked) : Infinity;
}

export interface WorkerRoom {
  room: number;
  /** The resources whose free amount fits exactly `room` actors, in `roomResourceSchema` order. */
  limitedBy: RoomResource[];
  /** One actor of the room size fits with nothing allocated; separates `full` from `tooSmall`. */
  fitsWhenEmpty: boolean;
}

const NO_ALLOCATION: SubstrateResources = { cpuMillicores: 0, memoryBytes: 0, actors: 0 };

function fitsByResource(
  worker: SubstrateWorker,
  allocated: SubstrateResources,
  size: RoomSize | null
): Record<RoomResource, number> {
  const { capacity } = worker;
  return {
    actors: Math.max(0, capacity.actors - allocated.actors),
    cpu: size ? fits(capacity.cpuMillicores - allocated.cpuMillicores, size.cpuMillicores) : Infinity,
    memory: size
      ? fits(capacity.memoryBytes - allocated.memoryBytes, bookedMemory(size.memoryBytes, worker.actorOverhead))
      : Infinity,
  };
}

/**
 * Actors of `size` that the worker can still host, as the Agent Substrate scheduler places them: each actor takes one
 * of `capacity.actors` and its limits plus the runtime overhead. Null when the worker hosts no actor (not active or not
 * registered). `size` null: actors only, runtime overhead not booked. Per-actor constraints (snapshot sandbox class,
 * selectors) are not applied.
 */
export function workerRoomOf(worker: SubstrateWorker, size: RoomSize | null): WorkerRoom | null {
  if (worker.state !== "active" || !worker.registered) return null;

  const fitsBy = fitsByResource(worker, worker.allocated, size);
  const room = Math.min(...Object.values(fitsBy));
  return {
    room,
    limitedBy: roomResourceSchema.options.filter((resource) => fitsBy[resource] === room),
    fitsWhenEmpty: Math.min(...Object.values(fitsByResource(worker, NO_ALLOCATION, size))) > 0,
  };
}

/** Over the active, registered workers of one worker pool. */
export function roomStateOf(workerRooms: WorkerRoom[]): RoomState {
  if (workerRooms.length === 0) return "noWorker";
  if (workerRooms.some(({ room }) => room > 0)) return "room";
  return workerRooms.some(({ fitsWhenEmpty }) => fitsWhenEmpty) ? "full" : "tooSmall";
}
