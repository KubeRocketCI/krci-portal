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

  return (
    <div className="bg-muted flex items-center justify-between rounded border pl-2">
      <div
        className={cn(
          "text-foreground relative overflow-x-auto overflow-y-hidden font-mono text-xs select-text",
          className
        )}
        style={{
          scrollbarWidth: "none" as const,
          msOverflowStyle: "none",
        }}
      >
        <span className="block whitespace-nowrap">{text}</span>
      </div>
      <div>
        <Button
          onClick={handleClickCopy}
          variant="ghost"
          size="sm"
          className="bg-muted hover:bg-muted/80 min-w-0 shrink-0 p-0"
        >
          {showCopied ? <CopyCheck size={12} /> : <Copy size={12} />}
        </Button>
      </div>
    </div>
  );
};
