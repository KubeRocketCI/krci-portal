import {
  roomStateSchema,
  type ActorRow,
  type Labels,
  type ReadyFleet,
  type RoomResource,
  type RoomSize,
  type RoomState,
  type WorkerPoolRef,
  type WorkerPoolRow,
} from "@my-project/shared";
import { plural } from "@/core/utils/format/plural";
import { formatMemory, formatMillicores } from "@/core/utils/quantity";
import type { Severity } from "@/core/utils/severity";

/** CPU and memory limits: of an actor template, or the room size of a worker pool. */
export function sizeText(size: RoomSize | null): string | null {
  if (!size) return null;
  return `${formatMillicores(size.cpuMillicores)} CPU, ${formatMemory(size.memoryBytes)}`;
}

/**
 * Null when room is not counted (no active, registered worker, or no actor template selects the worker pool), or for
 * a row from a server older than the client.
 */
export function roomSizeText({ roomState, roomSize }: Pick<WorkerPoolRoom, "roomState" | "roomSize">): string | null {
  if (roomSize === undefined || roomState === "noWorker" || roomState === "noTemplate") return null;
  return sizeText(roomSize) ?? "By actor count";
}

/**
 * `warning`: no room in this worker pool, room in another. `error`: no room in the fleet. `muted`: no actor template
 * selects the worker pool.
 */
export type VerdictTone = Exclude<Severity, "info"> | "muted";

export interface Verdict {
  tone: VerdictTone;
  text: string;
}

const NO_ROOM_TEXT: Record<Exclude<RoomState, "room" | "noTemplate">, string> = {
  full: "Full",
  tooSmall: "Too small for the room size",
  noWorker: "No active, registered worker",
};

const NO_ACTOR_CAPACITY_TEXT = "No actor capacity";

const NO_TEMPLATE_TEXT = "No actor template selects this worker pool";

export function fleetRoom(workerPools: ReadyFleet["workerPools"]): number {
  return workerPools.items.reduce((sum, { room }) => sum + room, 0);
}

/** A row from a server older than the client omits `roomState`, `limitedBy`, `roomSize` and `workerLabels`. */
export type WorkerPoolRoom = Pick<WorkerPoolRow, "room"> &
  Partial<Pick<WorkerPoolRow, "roomState" | "limitedBy" | "roomSize" | "workerLabels">>;

/** `tooSmall` with a null room size, or limited by the actor count alone: the workers have an actor capacity of 0. */
function noRoomText(
  roomState: Exclude<RoomState, "room" | "noTemplate">,
  { roomSize, limitedBy }: Pick<WorkerPoolRoom, "roomSize" | "limitedBy">
) {
  if (roomState !== "tooSmall") return NO_ROOM_TEXT[roomState];
  const actorsAlone = limitedBy?.length === 1 && limitedBy[0] === "actors";
  return roomSize === null || actorsAlone ? NO_ACTOR_CAPACITY_TEXT : NO_ROOM_TEXT.tooSmall;
}

/** Missing or unknown `roomState`: derive from `room` and `limitedBy` only; full and too small are not told apart. */
export function roomStateOf({ room, roomState, limitedBy }: WorkerPoolRoom): RoomState | null {
  if (roomState && roomStateSchema.options.includes(roomState)) return roomState;
  if (room > 0) return "room";
  return limitedBy?.length === 0 ? "noWorker" : null;
}

export function roomVerdict(workerPool: WorkerPoolRoom, totalRoom: number): Verdict {
  const roomState = roomStateOf(workerPool);
  if (roomState === "room") return { tone: "success", text: `Room for ${plural(workerPool.room, "actor")}` };
  if (roomState === "noTemplate") return { tone: "muted", text: NO_TEMPLATE_TEXT };
  if (roomState === null) {
    return totalRoom > 0 ? { tone: "warning", text: "No room" } : { tone: "error", text: "No room in the fleet" };
  }
  const text = noRoomText(roomState, workerPool);
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

export function limitedByText(limitedBy: RoomResource[] | undefined): string | null {
  if (!limitedBy?.length) return null;
  const text = joinAnd(limitedBy.map((resource) => ROOM_RESOURCE_LABEL[resource] ?? resource));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** `key=value`, by key. Undefined: a row from a server older than the client. */
export function labelsText(labels: Labels | undefined): string | null {
  const entries = Object.entries(labels ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  if (entries.length === 0) return null;
  return entries.map(([key, value]) => `${key}=${value}`).join(", ");
}

/** `namespace/name`: the worker pool label and the worker pool filter value. A Kubernetes name holds no `/`. */
export const workerPoolText = ({ namespace, name }: WorkerPoolRef): string => `${namespace}/${name}`;

/** `workerPoolText` of the worker pool of a placement. Undefined: the actor runs on no worker. */
export const placementWorkerPool = (placement: ActorRow["placement"]): string | undefined =>
  placement ? workerPoolText({ namespace: placement.workerNamespace, name: placement.workerPool }) : undefined;

/** Undefined: an actor from a server older than the client. */
export function workerPoolsText(workerPools: WorkerPoolRef[] | undefined): string | null {
  if (!workerPools?.length) return null;
  return workerPools.map(workerPoolText).join(", ");
}

/** Null: the actor template is gone. Undefined: an actor from a server older than the client. */
export function workerSelectorText(workerSelector: Labels | null | undefined): string | null {
  if (workerSelector === null || workerSelector === undefined) return null;
  return labelsText(workerSelector) ?? "Any worker";
}
