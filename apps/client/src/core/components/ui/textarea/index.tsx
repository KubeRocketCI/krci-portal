import * as React from "react";

import { cn } from "@/core/utils/classname";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  invalid?: boolean; // Purely visual indicator (optional)
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, className, rows, disabled, readOnly, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        rows={rows}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 bg-input w-full rounded-md border-transparent px-3 py-2 text-base wrap-anywhere shadow-none outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          rows ? "resize-none overflow-y-auto" : "flex field-sizing-content min-h-16",
          invalid &&
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          !disabled && "hover:bg-input/50",
          readOnly && "cursor-not-allowed select-none",
          className
        )}
        aria-invalid={invalid}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
