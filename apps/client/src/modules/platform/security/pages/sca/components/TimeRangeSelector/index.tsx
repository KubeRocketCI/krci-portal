import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";

export interface TimeRangeSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const timeRangeOptions: { value: number; label: string }[] = [
  { value: 30, label: "30 Days" },
  { value: 60, label: "60 Days" },
  { value: 90, label: "90 Days" },
  { value: 180, label: "180 Days" },
  { value: 365, label: "1 Year" },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
      {timeRangeOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn("h-7 px-3 text-xs", value === option.value && "shadow-sm")}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
