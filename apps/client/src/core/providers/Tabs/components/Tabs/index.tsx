import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { cn } from "@/core/utils/classname";
import { TabsProps } from "./types";

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab }: TabsProps) => {
  return (
    <ShadcnTabs
      value={activeTabIdx.toString()}
      onValueChange={(value) => {
        const newTabIdx = parseInt(value, 10);
        handleChangeTab({} as React.ChangeEvent<object>, newTabIdx);
      }}
      className="flex min-h-0 flex-1 flex-col rounded-[0.3125rem]"
    >
      <TabsList>
        {tabs.map(({ label, icon, disabled = false, onClick }, idx) => (
          <TabsTrigger
            key={`tab::${idx}`}
            value={idx.toString()}
            disabled={disabled}
            onClick={onClick}
            className="flex items-center gap-2"
          >
            {icon}
            {label}
          </TabsTrigger>
        ))}
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
