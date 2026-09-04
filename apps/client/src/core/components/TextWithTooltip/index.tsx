import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import React from "react";
import { TextWithTooltipProps } from "./types";

/** Tailwind needs literal class names; a template string does not generate them. */
const CLAMP_CLASSES = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
} as const;

export function TextWithTooltip({ text, className, maxLineAmount = 1, fallback = "—" }: TextWithTooltipProps) {
  const value = text === null || text === undefined || text === "" ? fallback : String(text);

  const [isOverflowed, setIsOverflowed] = React.useState(false);
  const [wantsOpen, setWantsOpen] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement | null>(null);
  const observerRef = React.useRef<ResizeObserver | null>(null);

  const measure = React.useCallback(() => {
    const node = textRef.current;
    if (!node) return;
    setIsOverflowed(node.offsetWidth < node.scrollWidth || node.offsetHeight < node.scrollHeight);
  }, []);

  /** The `<p>` is always mounted, so the ref only ever attaches once per element instance. */
  const setTextRef = React.useCallback(
    (node: HTMLParagraphElement | null) => {
      observerRef.current?.disconnect();
      textRef.current = node;
      if (!node) return;
      observerRef.current = new ResizeObserver(measure);
      observerRef.current.observe(node);
    },
    [measure]
  );

  React.useEffect(() => () => observerRef.current?.disconnect(), []);

  React.useEffect(() => {
    measure();
  }, [value, maxLineAmount, className, measure]);

  return (
    <Tooltip title={value} open={isOverflowed && wantsOpen} onOpenChange={setWantsOpen}>
      <p
        ref={setTextRef}
        className={cn("text-sm", "wrap-break-word", "text-inherit", CLAMP_CLASSES[maxLineAmount], className)}
      >
        {value}
      </p>
    </Tooltip>
  );
}
