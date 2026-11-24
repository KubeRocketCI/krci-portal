import type { RoomResource, RoomSize, WorkerPoolAccess, WorkerPoolResource } from "@my-project/shared";
import { plural } from "../../../utils/plural";
import { roomSizeLabel } from "../../../utils/roomLabel";

export interface RoomVerdict {
  /** False at room zero: the next agent waits. */
  hasRoom: boolean;
  text: string;
}

/** `limitedBy` empty: no worker of the worker pool is active and registered. */
export function roomVerdict(room: number, limitedBy: RoomResource[]): RoomVerdict {
  if (room > 0) return { hasRoom: true, text: `Room for ${plural(room, "agent")}` };
  return { hasRoom: false, text: `${limitedBy.length === 0 ? "No worker" : "Full"}: the next agent waits` };
}

const ROOM_RESOURCE_LABEL: Record<RoomResource, string> = {
  actors: "actor count",
  cpu: "CPU",
  memory: "memory",
};

function joinAnd(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function roomBasisText(roomSize: RoomSize | null, limitedBy: RoomResource[]): string {
  const size = roomSize ? roomSizeLabel(roomSize) : "no actor template limits";
  if (limitedBy.length === 0) return `${size} · no active, registered worker`;
  return `${size} · limited by ${joinAnd(limitedBy.map((resource) => ROOM_RESOURCE_LABEL[resource]))}`;
}

/** Resource null: the WorkerPool list was not read (`denied`, `error`) or has no WorkerPool of this name. */
export function replicasText(resource: WorkerPoolResource | null, access: WorkerPoolAccess): string {
  if (resource) return `${resource.desiredReplicas} desired, ${resource.readyReplicas} ready`;
  switch (access) {
    case "denied":
      return "no access";
    case "error":
      return "not readable";
    case "ok":
      return "no WorkerPool resource";
  }
}
