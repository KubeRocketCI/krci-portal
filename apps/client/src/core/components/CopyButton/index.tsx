import { Button } from "@/core/components/ui/button";
import { Copy, CopyCheck } from "lucide-react";
import { useCopyFeedback } from "@/core/hooks/useCopyFeedback";

export const CopyButton = ({ text, size = "small" }: { text: string; size?: "medium" | "small" }) => {
  const iconSize = size === "medium" ? 16 : 13;
  const shadcnSize = size === "medium" ? "default" : "icon-xs";

  const { copied, markCopied } = useCopyFeedback();

  const handleClickCopy = () => {
    navigator.clipboard.writeText(text);
    markCopied();
  };

  return (
    <Button
      onClick={handleClickCopy}
      variant="ghost"
      size={shadcnSize}
      className="min-w-0 shrink-0 rounded p-1 opacity-60 transition-all hover:bg-slate-100 hover:opacity-100"
    >
      {copied ? (
        <CopyCheck width={iconSize} height={iconSize} className="text-slate-500" />
      ) : (
        <Copy width={iconSize} height={iconSize} className="text-slate-500" />
      )}
    </Button>
  );
};
