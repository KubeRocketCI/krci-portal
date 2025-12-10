import { Button } from "@/core/components/ui/button";
import { Copy, CopyCheck } from "lucide-react";
import React from "react";
import { cn } from "@/core/utils/classname";

interface ScrollCopyTextProps {
  text: string;
  className?: string;
}

export const ScrollCopyText = ({ text, className }: ScrollCopyTextProps) => {
  const [showCopied, setShowCopied] = React.useState<boolean>(false);
  const [isActive, setIsActive] = React.useState<boolean>(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

  const shouldShowCopyButton = isActive || showCopied;

  return (
    <div
      className={cn("bg-muted flex items-center justify-between rounded pl-2", className)}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
      tabIndex={0}
    >
      <div
        className="text-foreground relative overflow-x-auto overflow-y-hidden font-mono text-xs select-text"
        style={{
          scrollbarWidth: "none" as const,
          msOverflowStyle: "none",
        }}
      >
        <span className="block whitespace-nowrap">{text}</span>
      </div>
      <div className={cn("transition-opacity duration-150", shouldShowCopyButton ? "opacity-100" : "opacity-0")}>
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
