import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { PageContentWrapperProps } from "./types";
import { CopyButton } from "../CopyButton";
import { PinButton } from "../PinButton";
import { TabButton } from "../TabButton";
import { Info } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { useScrollFades } from "@/core/hooks/use-scroll-fades";

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
  const { scrollRef: tabsScrollRef, showLeftFade, showRightFade } = useScrollFades<HTMLDivElement>();

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
              <div className="relative">
                <div
                  ref={tabsScrollRef}
                  className="flex gap-0 overflow-x-auto"
                  style={{ scrollbarWidth: "none" }}
                  {...(tabDataTour && { "data-tour": tabDataTour })}
                >
                  {tabs.map((tab, idx) => (
                    <TabButton
                      key={`tab::${idx}`}
                      label={tab.label}
                      icon={tab.icon}
                      isActive={activeTab === idx}
                      disabled={tab.disabled}
                      tourHighlight={tourHighlight}
                      tabId={tab.id}
                      onClick={() => {
                        tab.onClick?.();
                        onTabChange?.({} as React.ChangeEvent<object>, idx);
                      }}
                    />
                  ))}
                </div>
                {showLeftFade && (
                  <div className="from-card pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r to-transparent" />
                )}
                {showRightFade && (
                  <div className="from-card pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l to-transparent" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex min-w-0 grow flex-col overflow-hidden px-6">
        {hasTabs && (
          <div className="mt-6 flex min-w-0 grow flex-col">
            {tabs.map((tab, idx) => (
              <div
                key={`tab-content::${idx}`}
                className={cn("flex min-w-0 grow flex-col", activeTab !== idx && "hidden")}
              >
                {tab.component}
              </div>
            ))}
          </div>
        )}

        {!hasTabs && children && <div className="mt-6 flex grow flex-col">{children}</div>}
      </div>
    </div>
  );
};
