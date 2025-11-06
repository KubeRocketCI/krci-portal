"use client";

import * as React from "react";
import { useId } from "react";
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group";
import { cn } from "@/core/utils/classname";

export interface RadioGroupButtonOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  checkedIcon?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupWithButtonsProps extends Omit<React.ComponentProps<typeof RadioGroup>, "children"> {
  options: RadioGroupButtonOption[];
  className?: string;
  disabled?: boolean;
}

export const RadioGroupWithButtons = React.forwardRef<HTMLDivElement, RadioGroupWithButtonsProps>(
  ({ options, className, disabled, value, ...props }, ref) => {
    const id = useId();

    return (
      <RadioGroup ref={ref} className={cn("grid grid-cols-6 gap-2", className)} value={value} {...props}>
        {options.map((item) => {
          const isChecked = value === item.value;
          const displayIcon = isChecked && item.checkedIcon !== undefined ? item.checkedIcon : item.icon;

          return (
            <label
              key={`${id}-${item.value}`}
              className={cn(
                "bg-card relative flex flex-row items-center gap-2 rounded-md border border-transparent px-2 py-3 text-center shadow-sm transition-colors",
                disabled ? "pointer-events-none cursor-not-allowed opacity-50" : "hover:bg-primary/20",
                "has-data-[state=checked]:border-primary/80 has-data-[state=checked]:bg-primary/10"
              )}
            >
              <RadioGroupItem
                id={`${id}-${item.value}`}
                value={item.value}
                className="sr-only after:absolute after:inset-0"
                aria-label={`radio-${item.value}`}
                disabled={item.disabled}
              />
              {displayIcon && <span className="shrink-0">{displayIcon}</span>}
              <p className="text-foreground text-sm leading-none font-medium">{item.label}</p>
            </label>
          );
        })}
      </RadioGroup>
    );
  }
);

RadioGroupWithButtons.displayName = "RadioGroupWithButtons";
