import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { TabsProps } from "./types";

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab }: TabsProps) => {
  return (
    <ShadcnTabs
      value={activeTabIdx.toString()}
      onValueChange={(value) => {
        const newTabIdx = parseInt(value, 10);
        handleChangeTab({} as React.ChangeEvent<object>, newTabIdx);
      }}
      className="rounded-[0.3125rem]"
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
      {tabs.map(({ component }, idx) => (
        <TabsContent key={`tab::${idx}`} value={idx.toString()} className="relative flex h-full flex-col">
          {component}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
};
