import { useNavigate, useSearch } from "@tanstack/react-router";

/**
 * The tab id set shared by the standard resource detail pages (generic K8s detail,
 * CRD detail, and custom-resource detail). Pages that need extra tabs (e.g. Node's
 * conditions/charts) declare their own list instead.
 */
export const DEFAULT_DETAIL_TABS = ["overview", "yaml", "events"] as const;

export interface UseDetailTabsResult<T extends string> {
  activeTab: T;
  activeTabIdx: number;
  setTab: (t: T) => void;
  onTabChange: (_event: unknown, idx: number) => void;
}

export function useDetailTabs<T extends string>(tabIds: readonly T[]): UseDetailTabsResult<T> {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };

  const activeTab: T = (tabIds as readonly string[]).includes(search.tab ?? "") ? (search.tab as T) : tabIds[0];
  const activeTabIdx = tabIds.indexOf(activeTab);
  const setTab = (t: T) => void navigate({ search: { ...search, tab: t } as never });
  const onTabChange = (_event: unknown, idx: number) => setTab(tabIds[idx] ?? tabIds[0]);

  return { activeTab, activeTabIdx, setTab, onTabChange };
}
