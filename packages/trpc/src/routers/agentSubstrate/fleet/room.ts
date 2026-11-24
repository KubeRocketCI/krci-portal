import {
  roomResourceSchema,
  type Labels,
  type RoomResource,
  type RoomSize,
  type RoomState,
  type SubstrateResources,
} from "@my-project/shared";
import type { SubstrateWorker } from "../../../clients/agentSubstrate/index.js";

const GIB = 1n << 30n;

/**
 * The largest CPU limit and the largest memory limit, which may come from different actor templates.
 * Null when no actor template sets a CPU or memory limit.
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

/** As the Agent Substrate scheduler: every key of the worker selector equals the worker label of that key. */
export function selects(workerSelector: Labels, workerLabels: Labels): boolean {
  return Object.entries(workerSelector).every(
    ([key, value]) => Object.hasOwn(workerLabels, key) && workerLabels[key] === value
  );
}

export function hostsActors(worker: SubstrateWorker): boolean {
  return worker.state === "active" && worker.registered;
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
  /** The resources that fit no actor with nothing allocated, in `roomResourceSchema` order. Empty: one actor fits. */
  tooSmallBy: RoomResource[];
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
 * Actors of `size` that an active, registered worker can still host, as the Agent Substrate scheduler places them:
 * each actor takes one of `capacity.actors` and its limits plus the runtime overhead. `size` null: actors only,
 * runtime overhead not booked. Per-actor constraints (snapshot sandbox class, actor worker selector) are not applied.
 */
export function workerRoomOf(worker: SubstrateWorker, size: RoomSize | null): WorkerRoom {
  const fitsBy = fitsByResource(worker, worker.allocated, size);
  const fitsByWhenEmpty = fitsByResource(worker, NO_ALLOCATION, size);
  const room = Math.min(...Object.values(fitsBy));
  return {
    room,
    limitedBy: roomResourceSchema.options.filter((resource) => fitsBy[resource] === room),
    tooSmallBy: roomResourceSchema.options.filter((resource) => fitsByWhenEmpty[resource] === 0),
  };
}

export interface WorkerPoolRoom {
  room: number;
  limitedBy: RoomResource[];
  roomState: Extract<RoomState, "room" | "full" | "tooSmall">;
}

/** Over the workers of one worker pool that add room; at least one. */
export function workerPoolRoomOf(workerRooms: WorkerRoom[]): WorkerPoolRoom {
  const room = workerRooms.reduce((sum, workerRoom) => sum + workerRoom.room, 0);
  const roomState =
    room > 0 ? "room" : workerRooms.some(({ tooSmallBy }) => tooSmallBy.length === 0) ? "full" : "tooSmall";
  const bounds = new Set(
    workerRooms.flatMap(({ limitedBy, tooSmallBy }) => (roomState === "tooSmall" ? tooSmallBy : limitedBy))
  );
  return { room, limitedBy: roomResourceSchema.options.filter((resource) => bounds.has(resource)), roomState };
}
