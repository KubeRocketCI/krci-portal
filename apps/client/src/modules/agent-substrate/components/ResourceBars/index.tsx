import type { SubstrateResources } from "@my-project/shared";
import { UsageBar } from "@/core/components/UsageBar";
import { formatMemory, formatMillicores } from "@/core/utils/quantity";

interface ResourceBarsProps {
  capacity: SubstrateResources;
  allocated: SubstrateResources;
  showPercent?: boolean;
  /** False: the allocated actors as a number, with no bar of the actor capacity. See `showsActorsBar`. */
  actorsBar?: boolean;
}

/** Allocated of capacity: actors, CPU, memory. */
export function ResourceBars({ capacity, allocated, showPercent = false, actorsBar = true }: ResourceBarsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {actorsBar ? (
        <UsageBar label="Actors" value={allocated.actors} max={capacity.actors} showPercent={showPercent} />
      ) : (
        <div className="flex min-w-0 items-baseline justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Actors</span>
          <span className="tabular-nums">{allocated.actors}</span>
        </div>
      )}
      <UsageBar
        label="CPU"
        value={allocated.cpuMillicores}
        max={capacity.cpuMillicores}
        format={formatMillicores}
        showPercent={showPercent}
      />
      <UsageBar
        label="Memory"
        value={allocated.memoryBytes}
        max={capacity.memoryBytes}
        format={formatMemory}
        showPercent={showPercent}
      />
    </div>
  );
}
