import React from "react";
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { cn } from "@/core/utils/classname";
import { TabsProps } from "./types";
import { useTours } from "@/modules/tours";

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab }: TabsProps) => {
  const { isTourNavigating, currentTourTab } = useTours();
  const [shouldPulse, setShouldPulse] = React.useState(false);

  // When tour navigation starts, pulse for 1.5s then go static
  React.useEffect(() => {
    if (isTourNavigating) {
      setShouldPulse(true);
      const timer = setTimeout(() => {
        setShouldPulse(false);
      }, 1500); // Pulse for 1.5s (3 pulses)
      return () => clearTimeout(timer);
    } else {
      setShouldPulse(false);
    }
  }, [isTourNavigating]);

  return (
    <ShadcnTabs
      value={activeTabIdx.toString()}
      onValueChange={(value) => {
        const newTabIdx = parseInt(value, 10);
        handleChangeTab({} as React.ChangeEvent<object>, newTabIdx);
      }}
      className="flex min-h-0 flex-1 flex-col rounded-[0.3125rem]"
    >
      <TabsList data-tour="project-tabs">
        {tabs.map(({ label, icon, disabled = false, onClick, id }, idx) => {
          const isActive = activeTabIdx === idx;
          // Show outline if this tab matches the tour's focused tab
          const isTourFocusedTab = currentTourTab && id === currentTourTab;
          const shouldGlow = isActive && isTourFocusedTab;

          return (
            <TabsTrigger
              key={`tab::${idx}`}
              value={idx.toString()}
              disabled={disabled}
              onClick={onClick}
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                shouldGlow && "outline-primary outline outline-2 outline-offset-2",
                shouldGlow && shouldPulse && "animate-pulse"
              )}
            >
              {icon}
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {tabs.map(({ component }, idx) => {
        const isActive = activeTabIdx === idx;
        return (
          <TabsContent
            key={`tab::${idx}`}
            value={idx.toString()}
            forceMount
            className={cn("relative mt-6 flex h-full flex-col", !isActive && "hidden")}
          >
            {component}
          </TabsContent>
        );
      })}
    </ShadcnTabs>
  );
};
