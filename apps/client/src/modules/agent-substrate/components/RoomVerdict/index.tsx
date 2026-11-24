import type { ComponentType } from "react";
import { CircleMinus } from "lucide-react";
import type { WorkerPoolRow } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { cn } from "@/core/utils/classname";
import { SEVERITY_ICON, SEVERITY_ICON_COLOR_CLASS } from "@/core/utils/severity";
import { TERM_HINT } from "../../constants/hints";
import {
  labelsText,
  limitedByText,
  roomSizeText,
  roomVerdict,
  type VerdictTone,
  type WorkerPoolRoom,
} from "../../utils/roomLabel";
import { KV } from "../KV";

const VERDICT_ICON: Record<VerdictTone, ComponentType<{ className?: string }>> = {
  ...SEVERITY_ICON,
  muted: CircleMinus,
};

const VERDICT_COLOR_CLASS: Record<VerdictTone, string> = {
  ...SEVERITY_ICON_COLOR_CLASS,
  muted: "text-muted-foreground",
};

interface RoomVerdictProps {
  workerPool: WorkerPoolRow;
  /** Room summed over every worker pool of the fleet. */
  totalRoom: number;
}

/** The verdict, then the room size, limited by and worker labels of the worker pool. */
export function RoomVerdict({ workerPool, totalRoom }: RoomVerdictProps) {
  const verdict = roomVerdict(workerPool, totalRoom);
  const Icon = VERDICT_ICON[verdict.tone];

  return (
    <div className="flex flex-col gap-2">
      <p className={cn("flex items-center gap-2 text-sm font-medium", VERDICT_COLOR_CLASS[verdict.tone])}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {verdict.text}
      </p>
      <KV
        rows={[
          ["Room size", roomSizeText(workerPool), TERM_HINT.roomSize],
          ["Limited by", limitedByText(workerPool.limitedBy), TERM_HINT.limitedBy],
          ["Worker labels", labelsText(workerPool.workerLabels), TERM_HINT.workerLabels],
        ]}
      />
    </div>
  );
}

interface RoomVerdictCellProps {
  workerPool: WorkerPoolRoom;
  totalRoom: number;
}

export function RoomVerdictCell({ workerPool, totalRoom }: RoomVerdictCellProps) {
  const verdict = roomVerdict(workerPool, totalRoom);
  const Icon = VERDICT_ICON[verdict.tone];
  const colorClass = VERDICT_COLOR_CLASS[verdict.tone];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 tabular-nums">{workerPool.room}</span>
      <Icon className={cn("size-4 shrink-0", colorClass)} aria-hidden />
      <TextWithTooltip text={verdict.text} className={colorClass} />
    </div>
  );
}
