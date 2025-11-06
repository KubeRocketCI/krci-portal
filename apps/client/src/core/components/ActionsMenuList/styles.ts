import { cn } from "@/core/utils/classname";

export const actionsClasses = cn("flex justify-end items-center", "[&_.MuiTooltip-popper]:pointer-events-auto");

export const actionListClasses = "bg-background rounded-[5px] overflow-hidden py-2";

export const popperClasses = cn(
  "z-[5] cursor-default p-0 bg-background text-foreground",
  "shadow-[0px_5px_5px_-3px_#00000033,0px_8px_10px_1px_#00000024,0px_3px_14px_2px_#0000001F]",
  "rounded-[5px]"
);

export const childrenWrapperClasses = "flex items-center justify-end";
