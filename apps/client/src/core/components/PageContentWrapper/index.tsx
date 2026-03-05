import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { PageContentWrapperProps } from "./types";
import { CopyButton } from "../CopyButton";
import { PinButton } from "../PinButton";
import { Info } from "lucide-react";
import { cn } from "@/core/utils/classname";

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
  const hasTabs = tabs && tabs.length > 0;
  const hasHeader = title || description || actions || extraLinks || hasTabs;

  return (
    <div className="flex min-w-0 grow flex-col">
      {hasHeader && (
        <div className="bg-card overflow-hidden border-b">
          <div className={cn("px-4 pt-4 pb-0", hasTabs && "border-border border-b")}>
            <div className={cn("flex items-start justify-between gap-4", hasTabs || subHeader ? "mb-3" : "mb-4")}>
              <div className="flex items-start gap-3">
                {Icon && (
                  <div className="bg-primary/5 border-primary/10 mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border">
                    <Icon size={17} className="text-primary" />
                  </div>
                )}
                <div>
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
              <div className="flex flex-shrink-0 items-center gap-2">
                <div className="mr-4">{extraLinks}</div>
                {actions}
              </div>
            </div>

            {subHeader && <div className="mb-3">{subHeader}</div>}

            {hasTabs && (
              <div className="flex gap-0" {...(tabDataTour && { "data-tour": tabDataTour })}>
                {tabs.map((tab, idx) => {
                  const isActive = activeTab === idx;
                  const isTourFocusedTab = tourHighlight?.focusedTabId && tab.id === tourHighlight.focusedTabId;
                  const shouldGlow = isActive && isTourFocusedTab;

                  return (
                    <button
                      key={`tab::${idx}`}
                      onClick={(e) => {
                        tab.onClick?.();
                        onTabChange?.(e, idx);
                      }}
                      disabled={tab.disabled}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2.5 text-sm transition-all duration-300",
                        isActive ? "text-primary" : "text-slate-500 hover:text-slate-700",
                        tab.disabled && "cursor-not-allowed opacity-50",
                        shouldGlow && "outline-primary outline outline-2 outline-offset-2",
                        shouldGlow && tourHighlight?.isNavigating && "animate-pulse"
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                      {isActive && (
                        <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex min-w-0 grow flex-col overflow-hidden px-6">
        {hasTabs && (
          <div className="mt-6 min-w-0">
            {tabs.map((tab, idx) => (
              <div key={`tab-content::${idx}`} className={cn("flex min-w-0 flex-col", activeTab !== idx && "hidden")}>
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
