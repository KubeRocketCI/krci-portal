"use client";

import * as React from "react";
import { useId } from "react";
import { Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group";
import { cn } from "@/core/utils/classname";
import { toElement } from "@/core/utils/toElement";

export type RadioGroupButtonIcon =
  | React.ReactNode
  | React.ComponentType<{ className?: string }>
  | {
      default: React.ReactNode | React.ComponentType<{ className?: string }>;
      checked: React.ReactNode | React.ComponentType<{ className?: string }>;
    };

export interface RadioGroupButtonOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: RadioGroupButtonIcon;
  disabled?: boolean;
}

export type RadioGroupVariant = "horizontal" | "vertical";

export interface RadioGroupWithButtonsProps extends Omit<React.ComponentProps<typeof RadioGroup>, "children"> {
  options: RadioGroupButtonOption[];
  variant?: RadioGroupVariant;
  className?: string;
  disabled?: boolean;
}

// Helper to check if icon is a config object
const isIconConfig = (
  icon: RadioGroupButtonIcon | undefined
): icon is {
  default: React.ReactNode | React.ComponentType<{ className?: string }>;
  checked: React.ReactNode | React.ComponentType<{ className?: string }>;
} => {
  return (
    typeof icon === "object" &&
    icon !== null &&
    !React.isValidElement(icon) &&
    typeof icon !== "function" &&
    "default" in icon &&
    "checked" in icon
  );
};

// Helper to render an icon with icon-specific styling (className)
const renderIcon = (
  icon: React.ReactNode | React.ComponentType<{ className?: string }>,
  className = "h-4 w-4"
): React.ReactNode => {
  return toElement(icon, { className });
};

// Helper to get display icon with proper wrapping
const getDisplayIcon = (icon: RadioGroupButtonIcon | undefined, isChecked: boolean): React.ReactNode => {
  if (!icon) return null;

  if (isIconConfig(icon)) {
    // Custom icon config - use as-is without wrapping
    const iconToRender = isChecked ? icon.checked : icon.default;
    return renderIcon(iconToRender);
  }

  // Simple icon - wrap with default wrappers
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg",
        isChecked ? "bg-primary text-white" : "bg-card/50 text-secondary-foreground"
      )}
    >
      {renderIcon(icon)}
    </div>
  );
};

export const RadioGroupWithButtons = React.forwardRef<HTMLDivElement, RadioGroupWithButtonsProps>(
  ({ options, variant = "horizontal", className, disabled, value, ...props }, ref) => {
    const id = useId();

    return (
      <RadioGroup ref={ref} className={cn("grid grid-cols-2 gap-2", className)} value={value} {...props}>
        {options.map((item) => {
          const isChecked = value === item.value;
          const displayIcon = getDisplayIcon(item.icon, isChecked);

          return (
            <label
              key={`${id}-${item.value}`}
              className={cn(
                "bg-input relative cursor-pointer rounded-lg border-2 p-3",
                isChecked ? "bg-accent border-primary/50" : "border-transparent",
                disabled || item.disabled ? "pointer-events-none cursor-not-allowed opacity-50" : "",
                !isChecked && !disabled && "hover:bg-input/50"
              )}
            >
              <RadioGroupItem
                id={`${id}-${item.value}`}
                value={item.value}
                className="sr-only after:absolute after:inset-0"
                aria-label={`radio-${item.value}`}
                disabled={disabled || item.disabled}
              />
              {variant === "horizontal" ? (
                <div className="flex items-start gap-3">
                  {displayIcon && <span className="shrink-0">{displayIcon}</span>}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-foreground mb-0.5 text-sm font-medium">{item.label}</h4>
                    {item.description && <p className="text-muted-foreground text-xs">{item.description}</p>}
                  </div>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {isChecked && (
                      <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-full">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  {displayIcon && <span>{displayIcon}</span>}
                  <h4 className="text-foreground text-sm font-medium">{item.label}</h4>
                  {item.description && <p className="text-muted-foreground text-xs">{item.description}</p>}
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center">
                    {isChecked && (
                      <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-full">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </label>
          );
        })}
      </RadioGroup>
    );
  }
);

RadioGroupWithButtons.displayName = "RadioGroupWithButtons";
