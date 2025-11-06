import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group";
import { cn } from "@/core/utils/classname";

export interface TileRadioGroupOption {
  value: string;
  label: string;
  description?: string;
  icon: React.ReactElement;
  checkedIcon?: React.ReactElement;
  disabled?: boolean;
}

export interface TileRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: TileRadioGroupOption[];
  gridCols?: number;
  className?: string;
}

export const TileRadioGroup = React.forwardRef<HTMLLabelElement, TileRadioGroupProps>(
  ({ value, onValueChange, options, gridCols = 3, className }, ref) => {
    const fieldId = React.useId();

    return (
      <RadioGroup value={value || ""} onValueChange={onValueChange} className={cn("min-h-[150px] gap-6", className)}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${gridCols || 3}, minmax(0, 1fr))` }}>
          {options.map(({ value: optionValue, label, description, icon, checkedIcon, disabled }, idx) => {
            const isChecked = value === optionValue;
            const key = `${optionValue}::${idx}`;
            const radioId = `${fieldId}-${optionValue}`;

            return (
              <label
                key={key}
                htmlFor={radioId}
                ref={idx === 0 ? ref : undefined}
                className={cn(
                  "bg-card block w-full rounded border border-transparent p-6 shadow-sm transition-colors",
                  "hover:bg-primary/20",
                  "has-data-[state=checked]:border-primary/80 has-data-[state=checked]:bg-primary/10",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <RadioGroupItem
                  id={radioId}
                  value={optionValue}
                  disabled={disabled}
                  aria-label={`radio-${optionValue}`}
                />
                <div className={cn("flex h-full w-full flex-col gap-5", description ? "items-start" : "items-center")}>
                  <div className="flex flex-row items-center gap-2">
                    {isChecked && checkedIcon ? checkedIcon : icon}
                    <h6 className="text-base font-medium">{label}</h6>
                  </div>
                  {description && <span className="text-left text-xs">{description}</span>}
                </div>
              </label>
            );
          })}
        </div>
      </RadioGroup>
    );
  }
);

TileRadioGroup.displayName = "TileRadioGroup";
