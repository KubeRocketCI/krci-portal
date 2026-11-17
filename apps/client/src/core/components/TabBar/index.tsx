import { useState } from "react";
import { TabButton } from "@/core/components/TabButton";
import { usePrefersReducedMotion } from "@/core/hooks/use-reduced-motion";
import { useScrollFades } from "@/core/hooks/use-scroll-fades";
import { cn } from "@/core/utils/classname";
import { useEdgeAutoScroll } from "./hooks/useEdgeAutoScroll";
import { useRevealActiveTab } from "./hooks/useRevealActiveTab";
import type { TabBarProps } from "./types";

const FADE_CLASS_NAME =
  "from-card pointer-events-none absolute inset-y-0 w-8 to-transparent transition-opacity duration-200";

/**
 * A row of tab buttons that scrolls horizontally, without a scrollbar, when the tabs do not fit:
 * edge fades, mouse edge auto-scroll, and the active tab kept in view.
 */
export function TabBar({ tabs, activeIndex, onChange, dataTour, tourHighlight }: TabBarProps) {
  const [row, setRow] = useState<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { showLeftFade, showRightFade } = useScrollFades(row);
  useEdgeAutoScroll(row, !reducedMotion);
  useRevealActiveTab(row, activeIndex, tabs.length, reducedMotion);

  return (
    <div className="relative">
      {/* py-1 with -my-1 leaves room for the tour highlight outline the scroll container would clip. */}
      <div
        ref={setRow}
        className="-my-1 flex overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        {...(dataTour && { "data-tour": dataTour })}
      >
        {tabs.map((tab, idx) => (
          <TabButton
            key={`tab::${idx}`}
            label={tab.label}
            icon={tab.icon}
            isActive={activeIndex === idx}
            disabled={tab.disabled}
            tourHighlight={tourHighlight}
            tabId={tab.id}
            onClick={() => {
              tab.onClick?.();
              onChange(idx);
            }}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className={cn(FADE_CLASS_NAME, "left-0 bg-gradient-to-r", showLeftFade ? "opacity-100" : "opacity-0")}
      />
      <div
        aria-hidden="true"
        className={cn(FADE_CLASS_NAME, "right-0 bg-gradient-to-l", showRightFade ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
