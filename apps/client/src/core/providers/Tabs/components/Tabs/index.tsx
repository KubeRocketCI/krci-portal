import { cn } from "@/core/utils/classname";
import { TabsProps } from "./types";

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab, dataTour, tourHighlight }: TabsProps) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[0.3125rem]">
      <div className="bg-card overflow-hidden border-b">
        <div className="border-border border-b">
          <div className="flex gap-0" {...(dataTour && { "data-tour": dataTour })}>
            {tabs.map(({ label, icon, disabled = false, onClick, id }, idx) => {
              const isActive = activeTabIdx === idx;
              const isTourFocusedTab = tourHighlight?.focusedTabId && id === tourHighlight.focusedTabId;
              const shouldGlow = isActive && isTourFocusedTab;

              return (
                <button
                  key={`tab::${idx}`}
                  onClick={(e) => {
                    onClick?.();
                    handleChangeTab(e as React.ChangeEvent<object>, idx);
                  }}
                  disabled={disabled}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 text-sm transition-all duration-300",
                    isActive ? "text-primary" : "text-slate-500 hover:text-slate-700",
                    disabled && "cursor-not-allowed opacity-50",
                    shouldGlow && "outline-primary outline outline-2 outline-offset-2",
                    shouldGlow && tourHighlight?.isNavigating && "animate-pulse"
                  )}
                >
                  {icon}
                  {label}
                  {isActive && <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="relative mt-6 flex h-full min-w-0 flex-col">
        {tabs.map(({ component }, idx) => {
          const isActive = activeTabIdx === idx;
          return (
            <div key={`tab-content::${idx}`} className={cn("flex h-full min-w-0 flex-col", !isActive && "hidden")}>
              {component}
            </div>
          );
        })}
      </div>
    </div>
  );
};
