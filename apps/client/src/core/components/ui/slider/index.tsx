import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/core/utils/classname";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  thumbAriaLabel?: string | ((index: number) => string);
};

export const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, value, defaultValue, thumbAriaLabel, ...props }, ref) => {
    // Derive the number of thumbs from controlled `value` or uncontrolled `defaultValue`.
    // Fall back to 1 so the primitive is always usable without explicit values.
    const thumbCount = (value ?? defaultValue ?? [0]).length;
    return (
      <SliderPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        className={cn("relative flex w-full touch-none items-center select-none", className)}
        {...props}
      >
        <SliderPrimitive.Track className="bg-secondary relative h-1.5 w-full grow overflow-hidden rounded-full">
          <SliderPrimitive.Range className="bg-primary absolute h-full" />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }, (_, i) => {
          // For multi-thumb sliders, fall back to a generic "Value N" label so the
          // primitive remains WCAG-compliant when callers forget to pass one.
          // Single-thumb sliders inherit aria-label from the Root via Radix.
          const ariaLabel =
            typeof thumbAriaLabel === "function"
              ? thumbAriaLabel(i)
              : (thumbAriaLabel ?? (thumbCount > 1 ? `Value ${i + 1}` : undefined));
          return (
            <SliderPrimitive.Thumb
              key={i}
              aria-label={ariaLabel}
              className="border-primary bg-background focus-visible:ring-ring block h-4 w-4 rounded-full border-2 shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            />
          );
        })}
      </SliderPrimitive.Root>
    );
  }
);

Slider.displayName = "Slider";
