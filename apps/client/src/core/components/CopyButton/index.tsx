import { Button } from "@/core/components/ui/button";
import { Copy, CopyCheck } from "lucide-react";
import React from "react";

export const CopyButton = ({ text, size = "small" }: { text: string; size?: "medium" | "small" }) => {
  const iconSize = size === "medium" ? 20 : 15;
  const shadcnSize = size === "medium" ? "default" : "sm";

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
    <div className="text-muted-foreground pt-[0.4%]">
      <Button
        onClick={handleClickCopy}
        variant="ghost"
        size={shadcnSize}
        className="min-w-0 p-1"
      >
        {showCopied ? <CopyCheck size={iconSize} /> : <Copy size={iconSize} />}
      </Button>
    </div>
  );
};
