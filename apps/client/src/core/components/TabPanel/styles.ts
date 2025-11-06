import { cn } from "@/core/utils/classname";

export const tabPanelClasses = cn(
  "h-full flex flex-col relative",
  "[&[hidden]]:h-0 [&[hidden]]:w-0 [&[hidden]]:select-none [&[hidden]]:pointer-events-none [&[hidden]]:overflow-hidden"
);
