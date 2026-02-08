import { useCallback, useSyncExternalStore } from "react";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { LS_KEY_SIDEBAR_PINNED_ITEMS } from "@/core/services/local-storage/keys";

export type PinnedPageType = "project" | "deployment" | "stage" | "sca-project" | "sast-project";

export interface PinnedPage {
  /** Unique key in the format `"type:namespace/name"` (or `"type:namespace/parent/name"` for stages). */
  key: string;
  label: string;
  type: PinnedPageType;
  route: {
    to: string;
    params: Record<string, string>;
  };
}

let listeners: Array<() => void> = [];
let cachedSnapshot: PinnedPage[] = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_SIDEBAR_PINNED_ITEMS) ?? [];

function emitChange() {
  cachedSnapshot = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_SIDEBAR_PINNED_ITEMS) ?? [];
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): PinnedPage[] {
  return cachedSnapshot;
}

/**
 * Hook to manage pinned sidebar pages in localStorage with reactive updates.
 * Each pinned page stores its key, label, type, and navigation route.
 */
export function usePinnedItems() {
  const pinnedPages = useSyncExternalStore(subscribe, getSnapshot);

  const isPinned = useCallback((key: string) => pinnedPages.some((p) => p.key === key), [pinnedPages]);

  const togglePin = useCallback((page: PinnedPage) => {
    const current: PinnedPage[] = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_SIDEBAR_PINNED_ITEMS) ?? [];
    const exists = current.some((p) => p.key === page.key);
    const updated = exists ? current.filter((p) => p.key !== page.key) : [...current, page];
    LOCAL_STORAGE_SERVICE.setItem(LS_KEY_SIDEBAR_PINNED_ITEMS, updated);
    emitChange();
  }, []);

  return { pinnedPages, isPinned, togglePin };
}
