import { Button } from "@/core/components/ui/button";
import { Copy, CopyCheck } from "lucide-react";
import React from "react";

export const CopyButton = ({ text, size = "small" }: { text: string; size?: "medium" | "small" }) => {
  const iconSize = size === "medium" ? 16 : 13;
  const shadcnSize = size === "medium" ? "default" : "icon-xs";

  const [showCopied, setShowCopied] = React.useState<boolean>(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClickCopy = () => {
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
    <Button
      onClick={handleClickCopy}
      variant="ghost"
      size={shadcnSize}
      className="min-w-0 shrink-0 rounded p-1 opacity-60 transition-all hover:bg-slate-100 hover:opacity-100"
    >
      {showCopied ? (
        <CopyCheck width={iconSize} height={iconSize} className="text-slate-500" />
      ) : (
        <Copy width={iconSize} height={iconSize} className="text-slate-500" />
      )}
    </Button>
  );
};
