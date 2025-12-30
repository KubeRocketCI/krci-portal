import { Tooltip } from "@/core/components/ui/tooltip";
import { STATUS_COLORS } from "../../../constants/colors";

export interface ProgressSegment {
  value: number;
  color: string;
  label: string;
}

export interface StackedProgressBarProps {
  segments: ProgressSegment[];
  total: number;
  tooltip?: React.ReactNode;
  className?: string;
}

/**
 * Stacked horizontal progress bar component
 * Displays multiple colored segments representing different categories
 * Used for visualizing vulnerability severities and policy violations
 */
export function StackedProgressBar({ segments, total, tooltip, className = "" }: StackedProgressBarProps) {
  // Handle zero case - show green bar
  if (total === 0) {
    return (
      <div
        className={`border-border relative h-6 w-full overflow-hidden rounded border ${className}`}
        style={{ backgroundColor: STATUS_COLORS.PASSED }}
      >
        <div className="flex h-full items-center justify-center text-xs font-semibold text-white">0</div>
      </div>
    );
  }

  const progressBarElement = (
    <div className={`border-border bg-muted/20 relative h-6 w-full overflow-hidden rounded border ${className}`}>
      <div className="flex h-full w-full">
        {segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0;
          if (segment.value === 0) return null;

          return (
            <div
              key={index}
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color,
                minWidth: percentage > 0 ? "2px" : "0",
              }}
              className="relative flex h-full items-center justify-center"
              title={`${segment.label}: ${segment.value}`}
            >
              <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {segment.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // If tooltip provided, wrap in tooltip
  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="left">
        {progressBarElement}
      </Tooltip>
    );
  }

  return progressBarElement;
}
