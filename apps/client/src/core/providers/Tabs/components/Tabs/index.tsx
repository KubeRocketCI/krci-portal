import { TabBar } from "@/core/components/TabBar";
import { TabPanel } from "./components/TabPanel";
import { getTabKey, useVisitedTabs } from "./hooks/useVisitedTabs";
import { TabsProps } from "./types";

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab, dataTour, tourHighlight }: TabsProps) => {
  const { isVisited } = useVisitedTabs(tabs, activeTabIdx);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[0.3125rem]">
      <div className="bg-card border-b">
        <div className="border-border border-b">
          <TabBar
            tabs={tabs}
            activeIndex={activeTabIdx}
            onChange={(idx) => handleChangeTab({} as React.ChangeEvent<object>, idx)}
            dataTour={dataTour}
            tourHighlight={tourHighlight}
          />
        </div>
      </div>
      <div className="relative mt-6 flex h-full min-w-0 flex-col">
        {tabs.map((tab, idx) => (
          <TabPanel
            key={`tab-content::${getTabKey(tab, idx)}`}
            tab={tab}
            isActive={activeTabIdx === idx}
            isVisited={isVisited(tab, idx)}
            className="flex h-full min-w-0 flex-col"
          />
        ))}
      </div>
    </div>
  );
};
