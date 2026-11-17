import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { PageContentWrapperProps } from "./types";
import { CopyButton } from "../CopyButton";
import { PinButton } from "../PinButton";
import { TabBar } from "../TabBar";
import { Info } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { TabPanel } from "@/core/providers/Tabs/components/Tabs/components/TabPanel";
import { getTabKey, useVisitedTabs } from "@/core/providers/Tabs/components/Tabs/hooks/useVisitedTabs";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";

const NO_TABS: Tab[] = [];

export const PageContentWrapper: React.FC<PageContentWrapperProps> = ({
  icon: Icon,
  title,
  titleTooltip,
  enableCopyTitle,
  pinConfig,
  description,
  actions,
  extraLinks,
  subHeader,
  tabs,
  activeTab,
  onTabChange,
  tabDataTour,
  tourHighlight,
  children,
}) => {
  const { activeTabIdx, isVisited } = useVisitedTabs(tabs ?? NO_TABS, activeTab);

  const hasTabs = tabs && tabs.length > 0;
  const hasHeader = title || description || actions || extraLinks || hasTabs;

  return (
    <div className="flex min-w-0 grow flex-col">
      {hasHeader && (
        <div className="bg-card overflow-hidden border-b">
          <div className={cn("px-4 pt-4 pb-0", hasTabs && "border-border border-b")}>
            <div
              className={cn(
                "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4",
                hasTabs || subHeader ? "mb-3" : "mb-4"
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                  <div className="bg-primary/5 border-primary/10 mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border">
                    <Icon size={17} className="text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    {typeof title === "string" ? <span className="text-foreground font-semibold">{title}</span> : title}
                    {titleTooltip && (
                      <Tooltip title={titleTooltip}>
                        <Info size={13} className="text-slate-500 opacity-60 hover:opacity-100" />
                      </Tooltip>
                    )}
                    {enableCopyTitle && typeof title === "string" && <CopyButton text={title} />}
                    {pinConfig && <PinButton pinConfig={pinConfig} />}
                  </div>
                  {description && <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{description}</p>}
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center justify-end gap-2">
                <div className="mr-4">{extraLinks}</div>
                {actions}
              </div>
            </div>

            {subHeader && <div className="mb-3">{subHeader}</div>}

            {hasTabs && (
              <TabBar
                tabs={tabs}
                activeIndex={activeTabIdx}
                onChange={(idx) => onTabChange?.({} as React.ChangeEvent<object>, idx)}
                dataTour={tabDataTour}
                tourHighlight={tourHighlight}
              />
            )}
          </div>
        </div>
      )}

      <div className="flex min-w-0 grow flex-col overflow-hidden px-6">
        {hasTabs && (
          <div className="mt-6 flex min-w-0 grow flex-col">
            {tabs.map((tab, idx) => (
              <TabPanel
                key={`tab-content::${getTabKey(tab, idx)}`}
                tab={tab}
                isActive={activeTabIdx === idx}
                isVisited={isVisited(tab, idx)}
                className="flex min-w-0 grow flex-col"
              />
            ))}
          </div>
        )}

        {!hasTabs && children && <div className="mt-6 flex grow flex-col">{children}</div>}
      </div>
    </div>
  );
};
