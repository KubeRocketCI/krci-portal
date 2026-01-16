import * as React from "react";

import { cn } from "@/core/utils/classname";

export interface InputProps extends React.ComponentProps<"input"> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-none outline-none file:inline-flex file:h-7 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          invalid && "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          !disabled && "hover:bg-input/50",
          className
        )}
        aria-invalid={invalid}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
