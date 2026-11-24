import type { SubstrateResources } from "@my-project/shared";
import { UsageBar } from "@/core/components/UsageBar";
import { formatMemory, formatMillicores } from "@/core/utils/quantity";

interface ResourceBarsProps {
  capacity: SubstrateResources;
  allocated: SubstrateResources;
  showPercent?: boolean;
}

/** Allocated of capacity: actors, CPU, memory. */
export function ResourceBars({ capacity, allocated, showPercent = false }: ResourceBarsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <UsageBar label="Actors" value={allocated.actors} max={capacity.actors} showPercent={showPercent} />
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
