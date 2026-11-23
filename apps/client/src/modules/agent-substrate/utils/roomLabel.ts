import type { RoomSize } from "@my-project/shared";
import { formatMemory, formatMillicores } from "@/core/utils/quantity";

export function roomSizeLabel(roomSize: RoomSize | null): string {
  if (!roomSize) return "by actor count";
  return `at ${formatMillicores(roomSize.cpuMillicores)} CPU, ${formatMemory(roomSize.memoryBytes)}`;
}

export function roomLabel(room: number, roomSize: RoomSize | null): string {
  return `room ${room} (${roomSizeLabel(roomSize)})`;
}
