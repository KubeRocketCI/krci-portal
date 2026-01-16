import * as React from "react";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";

export interface ToggleButtonGroupProps<T extends string> {
  value: T;
  exclusive?: boolean;
  onChange: (event: React.MouseEvent<HTMLElement>, newValue: T | null) => void;
  size?: "sm" | "default" | "lg";
  children: React.ReactElement<ToggleButtonProps<T>>[];
  className?: string;
}

export interface ToggleButtonProps<T extends string> {
  value: T;
  children: React.ReactNode;
  className?: string;
}

export function ToggleButtonGroup<T extends string>({
  value,
  exclusive = true,
  onChange,
  size = "sm",
  children,
  className,
}: ToggleButtonGroupProps<T>) {
  const handleButtonClick = (buttonValue: T) => (event: React.MouseEvent<HTMLElement>) => {
    if (exclusive) {
      // For exclusive mode, if clicking the same button, don't change (or set to null if needed)
      const newValue = value === buttonValue ? null : buttonValue;
      onChange(event, newValue as T | null);
    } else {
      // For non-exclusive mode, toggle the value
      onChange(event, buttonValue);
    }
  };

  return (
    <div className={cn("inline-flex rounded-md border", className)} role="group">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement<ToggleButtonProps<T>>(child)) {
          return child;
        }

        const buttonValue = child.props.value;
        const isSelected = value === buttonValue;
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        return (
          <Button
            key={child.key || index}
            size={size}
            variant={isSelected ? "default" : "outline"}
            onClick={handleButtonClick(buttonValue)}
            className={cn(
              "rounded-none border-0",
              isFirst && "rounded-l-md border-l",
              isLast && "rounded-r-md border-r",
              !isFirst && !isLast && "border-x",
              !isFirst && "-ml-px",
              child.props.className
            )}
          >
            {child.props.children}
          </Button>
        );
      })}
    </div>
  );
}

export function ToggleButton<T extends string>({ children }: ToggleButtonProps<T>) {
  // This component is just a marker - the actual rendering is handled by ToggleButtonGroup
  // We return a fragment to avoid rendering anything directly
  return <>{children}</>;
}
