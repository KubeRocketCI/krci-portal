import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/core/utils/classname";
import { formatNumber } from "../../../utils/metrics";

export interface MetricProgressBarProps {
  label: string;
  value: number;
  percent: number;
  color: string;
}

export function MetricProgressBar({ label, value, percent, color }: MetricProgressBarProps) {
  return (
    <div className="text-center">
      <div className="text-muted-foreground mb-1 text-sm">{label}</div>
      <strong className="text-base" style={{ color }}>
        {formatNumber(value)} ({percent.toFixed(1)}%)
      </strong>
      <div className="mt-2">
        <ProgressPrimitive.Root
          className={cn("bg-border/50 relative h-1 w-full overflow-hidden rounded-full")}
          value={percent}
        >
          <ProgressPrimitive.Indicator
            className="h-full w-full flex-1 transition-all"
            style={{
              transform: `translateX(-${100 - (percent || 0)}%)`,
              backgroundColor: color,
            }}
          />
        </ProgressPrimitive.Root>
      </div>
    </div>
  );
}
