import React from "react";
import type { Tab } from "../types";

/** Identity of a tab slot: `tab.id`, else the index. `id` must be unique within one tab array. */
export function getTabKey(tab: Tab | undefined, index: number): string {
  return tab?.id ?? `idx:${index}`;
}

export interface VisitedTabs {
  /** `activeTab` with `undefined` resolved to 0. */
  activeTabIdx: number;
  /** True for the active tab and for every tab that has been active during the owner's lifetime. */
  isVisited: (tab: Tab, index: number) => boolean;
}

/** The visited set is keyed by `getTabKey`, only grows, and resets with the owning component. */
export function useVisitedTabs(tabs: readonly Tab[], activeTab: number | undefined): VisitedTabs {
  const activeTabIdx = activeTab ?? 0;
  const activeKey = getTabKey(tabs[activeTabIdx], activeTabIdx);

  const [visited, setVisited] = React.useState<ReadonlySet<string>>(() => new Set([activeKey]));

  if (!visited.has(activeKey)) {
    setVisited((prev) => new Set(prev).add(activeKey));
  }

  const isVisited = React.useCallback(
    (tab: Tab, index: number) => index === activeTabIdx || visited.has(getTabKey(tab, index)),
    [activeTabIdx, visited]
  );

  return { activeTabIdx, isVisited };
}
