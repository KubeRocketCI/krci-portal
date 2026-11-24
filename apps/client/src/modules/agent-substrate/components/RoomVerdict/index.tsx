import type { RoomSize } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { SEVERITY_ICON, SEVERITY_ICON_COLOR_CLASS } from "@/core/utils/severity";
import { roomBasisText, roomVerdict, type PoolRoom } from "../../utils/roomLabel";

interface RoomVerdictProps {
  pool: PoolRoom;
  roomSize: RoomSize | null;
  /** Room summed over every worker pool of the fleet. */
  totalRoom: number;
}

export function RoomVerdict({ pool, roomSize, totalRoom }: RoomVerdictProps) {
  const verdict = roomVerdict(pool, totalRoom);
  const Icon = SEVERITY_ICON[verdict.tone];

  return (
    <div className="flex flex-col gap-0.5">
      <p className={cn("flex items-center gap-2 text-sm font-medium", SEVERITY_ICON_COLOR_CLASS[verdict.tone])}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {verdict.text}
      </p>
      <p className="text-muted-foreground text-xs">{roomBasisText(roomSize, pool.limitedBy)}</p>
    </div>
  );
}
