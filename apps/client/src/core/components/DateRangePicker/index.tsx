import React from "react";
import { CalendarIcon, X } from "lucide-react";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/core/components/ui/calendar";
import { FormField } from "@/core/components/ui/form-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { cn } from "@/core/utils/classname";

export interface DateRangePickerValue {
  /** ISO 8601 timestamp for the inclusive start of the range. */
  from?: string;
  /** ISO 8601 timestamp for the inclusive end of the range. */
  to?: string;
}

export interface DateRangePickerProps {
  value: DateRangePickerValue;
  onChange: (value: DateRangePickerValue) => void;
  label?: React.ReactNode;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  helperText?: React.ReactNode;
  disabled?: boolean;
}

function parseIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

const DISPLAY_FORMAT = "MMM d, yyyy";

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select date range",
  tooltipText,
  helperText,
  disabled = false,
}) => {
  const fieldId = React.useId();
  const [open, setOpen] = React.useState(false);

  const selectedRange = React.useMemo<DateRange | undefined>(() => {
    const from = parseIsoDate(value.from);
    const to = parseIsoDate(value.to);
    if (!from && !to) return undefined;
    return { from, to };
  }, [value.from, value.to]);

  const displayLabel = React.useMemo(() => {
    const from = selectedRange?.from;
    const to = selectedRange?.to;
    if (from && to) return `${format(from, DISPLAY_FORMAT)} – ${format(to, DISPLAY_FORMAT)}`;
    if (from) return format(from, DISPLAY_FORMAT);
    return null;
  }, [selectedRange]);

  const handleSelect = (range: DateRange | undefined) => {
    onChange({
      from: range?.from ? startOfDay(range.from).toISOString() : undefined,
      to: range?.to ? endOfDay(range.to).toISOString() : undefined,
    });
  };

  const handleClear = () => {
    onChange({ from: undefined, to: undefined });
  };

  const showClear = !!displayLabel && !disabled;

  return (
    <FormField label={label} tooltipText={tooltipText} helperText={helperText} id={fieldId} disabled={disabled}>
      {/* The clear button is a sibling of (not nested in) the popover trigger, so it stays a real,
          keyboard-focusable <button> and avoids nesting interactive content inside another button. */}
      <div className="relative w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              id={fieldId}
              disabled={disabled}
              className={cn(
                "bg-input hover:bg-input/50 flex h-9 w-full items-center gap-2 rounded-md border-transparent py-1 pl-3 text-sm shadow-none",
                "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
                "disabled:cursor-not-allowed disabled:opacity-50",
                showClear ? "pr-9" : "pr-3",
                !displayLabel && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="size-4 shrink-0 opacity-50" />
              <span className="truncate">{displayLabel ?? placeholder}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={handleSelect}
              defaultMonth={selectedRange?.from}
            />
          </PopoverContent>
        </Popover>
        {showClear && (
          <button
            type="button"
            aria-label="Clear date range"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground focus:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded focus:ring-2 focus:outline-hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </FormField>
  );
};

DateRangePicker.displayName = "DateRangePicker";
