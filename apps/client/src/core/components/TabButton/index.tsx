import { cn } from "@/core/utils/classname";
import type { TourHighlight } from "@/core/providers/Tabs/components/Tabs/types";

interface TabButtonProps {
  label: string;
  icon?: React.ReactElement;
  isActive: boolean;
  disabled?: boolean;
  tourHighlight?: TourHighlight;
  tabId?: string;
  onClick: () => void;
}

export function TabButton({ label, icon, isActive, disabled, tourHighlight, tabId, onClick }: TabButtonProps) {
  const isTourFocusedTab = tourHighlight?.focusedTabId && tabId === tourHighlight.focusedTabId;
  const shouldGlow = isActive && isTourFocusedTab;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition-all duration-300",
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
}
