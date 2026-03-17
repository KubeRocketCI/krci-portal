import { Button } from "@/core/components/ui/button";
import { Copy, CopyCheck } from "lucide-react";
import React from "react";
import { cn } from "@/core/utils/classname";

const COPIED_RESET_MS = 2000;

interface CopyIconButtonProps {
  value: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "link" | "default" | "destructive" | "secondary";
  iconClassName?: string;
}

export function CopyIconButton({
  value,
  className,
  size = "sm",
  variant = "ghost",
  iconClassName = "w-3.5 h-3.5 text-slate-400",
}: CopyIconButtonProps) {
  const [showCopied, setShowCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowCopied(true);
    timeoutRef.current = setTimeout(() => setShowCopied(false), COPIED_RESET_MS);
  };

  React.useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("h-7 w-7 p-0", className)}
      onClick={handleClick}
      disabled={!value}
    >
      {showCopied ? <CopyCheck className={iconClassName} /> : <Copy className={iconClassName} />}
    </Button>
  );
}
