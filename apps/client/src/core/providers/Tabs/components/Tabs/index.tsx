import { TabButton } from "@/core/components/TabButton";
import { useEdgeScroll } from "@/core/hooks/use-edge-scroll";
import { useScrollFades } from "@/core/hooks/use-scroll-fades";
import { cn } from "@/core/utils/classname";
import { TabPanel } from "./components/TabPanel";
import { getTabKey, useVisitedTabs } from "./hooks/useVisitedTabs";
import { TabsProps } from "./types";

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab, dataTour, tourHighlight }: TabsProps) => {
  const { isVisited } = useVisitedTabs(tabs, activeTabIdx);
  const { scrollRef, scrollElement, showLeftFade, showRightFade } = useScrollFades<HTMLDivElement>();
  useEdgeScroll(scrollElement, { activeIndex: activeTabIdx, itemCount: tabs.length });

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[0.3125rem]">
      <div className="bg-card border-b">
        <div className="border-border border-b">
          <div className="relative">
            {/* py-1 with -my-1 leaves room for the tour highlight outline the scroll container would clip. */}
            <div
              ref={scrollRef}
              className="-my-1 flex gap-0 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              {...(dataTour && { "data-tour": dataTour })}
            >
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
            <div
              aria-hidden="true"
              className={cn(
                "from-card pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r to-transparent transition-opacity duration-200",
                showLeftFade ? "opacity-100" : "opacity-0"
              )}
            />
            <div
              aria-hidden="true"
              className={cn(
                "from-card pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l to-transparent transition-opacity duration-200",
                showRightFade ? "opacity-100" : "opacity-0"
              )}
            />
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
