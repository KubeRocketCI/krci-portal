import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { cn } from "@/core/utils/classname";
import { TabsProps } from "./types";

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab, dataTour, tourHighlight }: TabsProps) => {
  return (
    <ShadcnTabs
      value={activeTabIdx.toString()}
      onValueChange={(value) => {
        const newTabIdx = parseInt(value, 10);
        handleChangeTab({} as React.ChangeEvent<object>, newTabIdx);
      }}
      className="flex min-h-0 flex-1 flex-col rounded-[0.3125rem]"
    >
      <TabsList {...(dataTour && { "data-tour": dataTour })}>
        {tabs.map(({ label, icon, disabled = false, onClick, id }, idx) => {
          const isActive = activeTabIdx === idx;
          const isTourFocusedTab = tourHighlight?.focusedTabId && id === tourHighlight.focusedTabId;
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
                shouldGlow && tourHighlight?.isNavigating && "animate-pulse"
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
