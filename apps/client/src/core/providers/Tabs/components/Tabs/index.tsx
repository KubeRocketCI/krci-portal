import { TabButton } from "@/core/components/TabButton";
import { TabPanel } from "./components/TabPanel";
import { getTabKey, useVisitedTabs } from "./hooks/useVisitedTabs";
import { TabsProps } from "./types";

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab, dataTour, tourHighlight }: TabsProps) => {
  const { isVisited } = useVisitedTabs(tabs, activeTabIdx);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[0.3125rem]">
      <div className="bg-card border-b">
        <div className="border-border border-b">
          <div className="flex gap-0" {...(dataTour && { "data-tour": dataTour })}>
            {tabs.map(({ label, icon, disabled = false, onClick, id }, idx) => (
              <TabButton
                key={`tab::${idx}`}
                label={label}
                icon={icon}
                isActive={activeTabIdx === idx}
                disabled={disabled}
                tourHighlight={tourHighlight}
                tabId={id}
                onClick={() => {
                  onClick?.();
                  handleChangeTab({} as React.ChangeEvent<object>, idx);
                }}
              />
            ))}
          </div>
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
