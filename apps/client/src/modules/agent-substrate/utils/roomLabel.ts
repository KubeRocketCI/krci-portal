import {
  roomStateSchema,
  type ReadyFleetSnapshot,
  type RoomResource,
  type RoomSize,
  type RoomState,
  type WorkerPoolRow,
} from "@my-project/shared";
import { formatMemory, formatMillicores } from "@/core/utils/quantity";
import type { Severity } from "@/core/utils/severity";
import { plural } from "./plural";

export function roomSizeLabel(roomSize: RoomSize | null): string {
  if (!roomSize) return "by actor count";
  return `at ${formatMillicores(roomSize.cpuMillicores)} CPU, ${formatMemory(roomSize.memoryBytes)}`;
}

export interface Verdict {
  /** `warning`: no room in this worker pool, room in another. `error`: no room in the fleet. */
  tone: Exclude<Severity, "info">;
  text: string;
}

const NO_ROOM_TEXT: Record<Exclude<RoomState, "room">, string> = {
  full: "Full",
  tooSmall: "Too small for the room size",
  noWorker: "No active, registered worker",
};

export function fleetRoom(workerPools: ReadyFleetSnapshot["workerPools"]): number {
  return workerPools.items.reduce((sum, { room }) => sum + room, 0);
}

/** A row from a server older than the client omits `roomState` and `limitedBy`. */
export type PoolRoom = Pick<WorkerPoolRow, "room"> & Partial<Pick<WorkerPoolRow, "roomState" | "limitedBy">>;

/**
 * A missing or unknown `roomState`: only what `room` and `limitedBy` prove; full and too small are not told apart.
 */
function roomStateOf({ room, roomState, limitedBy }: PoolRoom): RoomState | null {
  if (roomState && roomStateSchema.options.includes(roomState)) return roomState;
  if (room > 0) return "room";
  return limitedBy?.length === 0 ? "noWorker" : null;
}

export function roomVerdict(pool: PoolRoom, totalRoom: number): Verdict {
  const roomState = roomStateOf(pool);
  if (roomState === "room") return { tone: "success", text: `Room for ${plural(pool.room, "agent")}` };
  if (roomState === null) {
    return totalRoom > 0 ? { tone: "warning", text: "No room" } : { tone: "error", text: "No room in the fleet" };
  }
  const text = NO_ROOM_TEXT[roomState];
  if (totalRoom > 0) return { tone: "warning", text };
  return { tone: "error", text: `${text}: no room in the fleet` };
}

const ROOM_RESOURCE_LABEL: Record<RoomResource, string> = {
  actors: "actor count",
  cpu: "CPU",
  memory: "memory",
};

function joinAnd(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function roomBasisText(roomSize: RoomSize | null, limitedBy: RoomResource[] | undefined): string {
  const size = roomSize ? roomSizeLabel(roomSize) : "no actor template limits";
  if (!limitedBy?.length) return size;
  return `${size} · limited by ${joinAnd(limitedBy.map((resource) => ROOM_RESOURCE_LABEL[resource] ?? resource))}`;
}
