import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import React from "react";
import { TextWithTooltipProps } from "./types";

export const TextWithTooltip = ({ text, className, maxLineAmount = 1 }: TextWithTooltipProps) => {
  const [isOverflowed, setIsOverflowed] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement | null>(null);
  const observerRef = React.useRef<ResizeObserver | null>(null);

  const measure = React.useCallback(() => {
    const node = textRef.current;
    if (!node) return;
    setIsOverflowed(node.offsetWidth < node.scrollWidth || node.offsetHeight < node.scrollHeight);
  }, []);

  /**
   * Ref callback, not an effect: flipping `isOverflowed` moves the `<p>` between the root
   * and the `Tooltip` trigger, so React remounts it. The observer re-attaches to the new node.
   */
  const setTextRef = React.useCallback(
    (node: HTMLParagraphElement | null) => {
      observerRef.current?.disconnect();
      textRef.current = node;
      if (!node) return;
      observerRef.current = new ResizeObserver(measure);
      observerRef.current.observe(node);
      measure();
    },
    [measure]
  );

  React.useEffect(() => () => observerRef.current?.disconnect(), []);

  React.useEffect(() => {
    measure();
  }, [text, maxLineAmount, className, measure]);

  const Content = (
    <p
      ref={setTextRef}
      className={cn("text-sm", "wrap-break-word", "text-inherit", `line-clamp-${maxLineAmount}`, className)}
    >
      {text}
    </p>
  );

  if (isOverflowed) {
    return <Tooltip title={text}>{Content}</Tooltip>;
  }

  return Content;
};
