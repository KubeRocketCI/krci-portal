import { Button } from "@/core/components/ui/button";
import { Copy, CopyCheck } from "lucide-react";
import React from "react";
import { cn } from "@/core/utils/classname";

interface ScrollCopyTextProps {
  text: string;
  className?: string;
  showFromEnd?: boolean;
}

export const ScrollCopyText = ({ text, className, showFromEnd = false }: ScrollCopyTextProps) => {
  const [showCopied, setShowCopied] = React.useState<boolean>(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  const updateFades = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const hasOverflow = maxScrollLeft > 1;

    setShowLeftFade(hasOverflow && el.scrollLeft > 1);
    setShowRightFade(hasOverflow && el.scrollLeft < maxScrollLeft - 1);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (showFromEnd) {
      el.scrollLeft = el.scrollWidth;
    }

    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });

    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFades);
      resizeObserver.disconnect();
    };
  }, [updateFades, text, showFromEnd]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClickCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setShowCopied(true);
    timeoutRef.current = setTimeout(() => {
      setShowCopied(false);
    }, 2000);
  };

  return (
    <div className={cn("bg-muted flex items-center justify-between rounded pl-2", className)}>
      <div className="relative mr-1 min-w-0 flex-1">
        <div
          ref={scrollRef}
          className="text-foreground relative overflow-x-auto overflow-y-hidden pr-4 font-mono text-xs select-text"
          style={{
            scrollbarWidth: "none" as const,
            msOverflowStyle: "none",
          }}
        >
          <span className="block whitespace-nowrap">{text}</span>
        </div>

        {showLeftFade && (
          <div className="from-muted pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r to-transparent" />
        )}
        {showRightFade && (
          <div className="from-muted pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l to-transparent" />
        )}
      </div>
      <div>
        <Button
          onClick={handleClickCopy}
          variant="ghost"
          size="sm"
          className="bg-muted hover:bg-muted/80 min-w-0 shrink-0 p-0"
          tabIndex={-1}
        >
          {showCopied ? <CopyCheck size={12} /> : <Copy size={12} />}
        </Button>
      </div>
    </div>
  );
};
