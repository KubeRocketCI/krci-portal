import type { RouteSearchTab } from "./route";

/** Tab ids in display order. Must match the tab order in usePageTabs. */
const TAB_ORDER: RouteSearchTab[] = [
  "overview",
  "branches",
  "pipelines",
  "security",
  "vulnerabilities",
  "findings",
  "code",
  "deployments",
];

/**
 * Index of the tab in the tab bar. The `findings` tab exists only while DefectDojo is configured;
 * without it `?tab=findings` falls back to Overview.
 */
export function getTabIndex(tab: RouteSearchTab | undefined, hasFindingsTab: boolean): number {
  const visibleTabs = hasFindingsTab ? TAB_ORDER : TAB_ORDER.filter((id) => id !== "findings");
  const index = tab ? visibleTabs.indexOf(tab) : 0;

  return index === -1 ? 0 : index;
}
