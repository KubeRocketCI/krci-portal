import type { WorkerPoolRoom } from "./roomLabel";

/**
 * A worker reports an actor capacity independent of its CPU and memory. No bar when room is not counted
 * (`noTemplate`). A row from a server older than the client has no `roomSize`: a bar.
 */
export function showsActorsBar({
  roomState,
  roomSize,
  limitedBy,
}: Pick<WorkerPoolRoom, "roomState" | "roomSize" | "limitedBy">): boolean {
  if (roomState === "noTemplate") return false;
  return roomSize === null || roomSize === undefined || limitedBy?.includes("actors") === true;
}
