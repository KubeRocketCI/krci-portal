import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import { TextWithTooltipProps } from "./types";

export const TextWithTooltip = ({ text, className, maxLineAmount = 1 }: TextWithTooltipProps) => {
  const [isOverflowed, setIsOverflowed] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  const handleResize = () => {
    if (textRef.current) {
      const isOverflow =
        textRef.current.offsetWidth < textRef.current.scrollWidth ||
        textRef.current.offsetHeight < textRef.current.scrollHeight;
      setIsOverflowed(isOverflow);
    }
  };

  React.useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [text, maxLineAmount, className]);

  const Content = (
    <p
      ref={textRef}
      className={cn("text-sm", "wrap-break-word", "text-inherit", `line-clamp-${maxLineAmount}`, className)}
    >
      {text}
    </p>
  );

  if (isOverflowed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{Content}</TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    );
  }

  return Content;
};
