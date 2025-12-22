import { Button } from "@/core/components/ui/button";
import { TIME_RANGES, TimeRange } from "@my-project/shared";
import { cn } from "@/core/utils/classname";

export interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: TIME_RANGES.TODAY, label: "Today" },
  { value: TIME_RANGES.WEEK, label: "7 Days" },
  { value: TIME_RANGES.MONTH, label: "30 Days" },
  { value: TIME_RANGES.QUARTER, label: "90 Days" },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {timeRangeOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 px-3 text-xs",
            value === option.value && "shadow-sm"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
