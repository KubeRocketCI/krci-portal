import type { ReactNode } from "react";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import { FOCUS_RING_CLASS } from "../utils";

interface FocusableTooltipTextProps {
  hint: ReactNode;
  /** Read by screen readers instead of the children, which are then hidden from them. */
  screenReaderText?: string;
  className?: string;
  children: ReactNode;
}

/** Text that shows `hint` on hover and keyboard focus. */
export function FocusableTooltipText({ hint, screenReaderText, className, children }: FocusableTooltipTextProps) {
  return (
    <Tooltip title={hint}>
      <span tabIndex={0} className={cn(FOCUS_RING_CLASS, className)}>
        {screenReaderText ? (
          <>
            <span className="sr-only">{screenReaderText}</span>
            <span aria-hidden="true">{children}</span>
          </>
        ) : (
          children
        )}
      </span>
    </Tooltip>
  );
}
