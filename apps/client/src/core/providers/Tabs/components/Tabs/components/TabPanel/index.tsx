import { Activity } from "react";
import { cn } from "@/core/utils/classname";
import type { Tab } from "../../types";

interface TabPanelProps {
  tab: Tab;
  isActive: boolean;
  isVisited: boolean;
  className: string;
}

export function TabPanel({ tab, isActive, isVisited, className }: TabPanelProps) {
  if (!isVisited) {
    return null;
  }

  if (tab.persistent) {
    return <div className={cn(className, !isActive && "hidden")}>{tab.component}</div>;
  }

  return (
    <Activity mode={isActive ? "visible" : "hidden"}>
      <div className={className}>{tab.component}</div>
    </Activity>
  );
}
