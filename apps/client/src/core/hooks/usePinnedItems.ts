import { useCallback, useMemo, useSyncExternalStore } from "react";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { LS_KEY_SIDEBAR_PINNED_ITEMS } from "@/core/services/local-storage/keys";
import { PATH_TO_ICON_TYPE } from "@/core/constants/page-icons";
import type { PageIconType } from "@/core/constants/page-icons";
import { buildPinKey } from "@/core/utils/pinKey";

export type PinnedPageType =
  | "project"
  | "deployment"
  | "stage"
  | "sca-project"
  | "sast-project"
  | "overview"
  | "pipelineruns"
  | "pipelines"
  | "pipeline"
  | "pipelineRun"
  | "tasks"
  | "event-listeners"
  | "triggers"
  | "trigger-templates"
  | "trigger-bindings"
  | "interceptors"
  | "cluster-interceptors"
  | "projects"
  | "deployments"
  | "pipeline-metrics"
  | "sca"
  | "sca-projects"
  | "sast"
  | "trivy-overview"
  | "trivy-vulnerabilities"
  | "trivy-exposed-secrets"
  | "trivy-config-audits"
  | "trivy-rbac-assessments"
  | "trivy-infra-assessments"
  | "trivy-compliance"
  | "trivy-cluster-config-audits"
  | "trivy-cluster-rbac-assessments"
  | "trivy-cluster-infra-assessments"
  | "trivy-cluster-vulnerabilities"
  | "config-quicklinks"
  | "config-nexus"
  | "config-registry"
  | "config-clusters"
  | "config-gitops"
  | "config-argocd"
  | "config-defectdojo"
  | "config-dependency-track"
  | "config-sonar"
  | "config-gitservers"
  | "config-jira";

export interface PinnedPage {
  /**
   * Unique, cluster-agnostic key for this pinned page.
   *
   * Format:
   *   - No identifying params (or only `clusterName`):
   *     `page:<routePath>`
   *     e.g. `page:/c/$clusterName/cicd/pipelines`
   *   - With identifying params (sorted by key name):
   *     `page:<routePath>?<k1>=<v1>&<k2>=<v2>`
   *     e.g. `page:/c/$clusterName/k8s/$kind?kind=deployments`
   *     e.g. `page:/c/$clusterName/k8s/cr/$group/$version/$plural?group=apps&plural=mycrds&version=v1`
   */
  key: string;
  label: string;
  type: PinnedPageType;
  /** Icon type from PAGE_ICONS registry. Optional for backwards compatibility. */
  iconType?: PageIconType;
  route: {
    to: string;
    params: Record<string, string>;
  };
}

/**
 * Normalize stored pinned items to the current format in a single pass:
 *  1. iconType backfill — items stored without an `iconType` get it derived
 *     from their route path or type.
 *  2. Key recomputation — each key is rebuilt from the item's stored `route`
 *     via `buildPinKey`, so items sharing a generic route template (e.g. K8s
 *     list pages under `page:/c/$clusterName/k8s/$kind`) get distinct,
 *     param-aware keys.
 *
 * Duplicate keys are then removed (first occurrence wins).
 *
 * Returns the normalized array; the caller decides whether to persist it.
 */
export function migratePinnedItems(items: PinnedPage[]): PinnedPage[] {
  // Step 1: backfill iconType and recompute keys from stored route.
  const withIconAndKey = items.map((item): PinnedPage => {
    // Recompute the key from the item's stored route so that old single-format
    // keys (e.g. `page:/c/$clusterName/k8s/$kind`) become param-aware.
    const recomputedKey = buildPinKey(item.route.to, item.route.params);

    // First resolve any iconType backfill; the key update is applied once below.
    let updated = item;
    if (!item.iconType) {
      // Derive iconType from the route path via the canonical map (shared with createPinConfig).
      const iconType = PATH_TO_ICON_TYPE[item.route.to];
      if (iconType) {
        updated = { ...item, iconType, type: iconType as PinnedPageType };
      } else if (["project", "deployment", "stage", "sca-project", "sast-project"].includes(item.type)) {
        // For detail pages (project, deployment, stage, etc.) iconType matches type.
        updated = { ...item, iconType: item.type as PageIconType };
      }
    }

    // Apply the recomputed key in a single place, preserving the original
    // reference when nothing changed so callers can detect no-ops by identity.
    return recomputedKey !== updated.key ? { ...updated, key: recomputedKey } : updated;
  });

  // Step 2: dedupe by key, keeping first occurrence.
  const seen = new Set<string>();
  return withIconAndKey.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

let listeners: Array<() => void> = [];
const rawSnapshot = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_SIDEBAR_PINNED_ITEMS) ?? [];
let cachedSnapshot: PinnedPage[] = migratePinnedItems(rawSnapshot);

// Persist migrated items back to localStorage only when something actually changed:
// either an iconType was backfilled, a key was recomputed, or a duplicate was removed.
// `migratePinnedItems` returns the original element reference for items it leaves
// untouched and a fresh object only for items it changes, so reference inequality
// detects any modification without recomputing keys a second time. A length change
// means a duplicate was dropped; index comparison is only valid once lengths match.
const needsMigration =
  cachedSnapshot.length !== rawSnapshot.length || cachedSnapshot.some((item, i) => item !== rawSnapshot[i]);

if (needsMigration && cachedSnapshot.length > 0) {
  LOCAL_STORAGE_SERVICE.setItem(LS_KEY_SIDEBAR_PINNED_ITEMS, cachedSnapshot);
}

function emitChange() {
  const raw = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_SIDEBAR_PINNED_ITEMS) ?? [];
  cachedSnapshot = migratePinnedItems(raw);
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

  // Index keys into a Set so each row's lookup is O(1); the sidebar calls isPinned
  // once per row, so a linear scan here would be O(rows × pins) on every render.
  const pinnedKeys = useMemo(() => new Set(pinnedPages.map((p) => p.key)), [pinnedPages]);
  const isPinned = useCallback((key: string) => pinnedKeys.has(key), [pinnedKeys]);

  const togglePin = useCallback((page: PinnedPage) => {
    const current: PinnedPage[] = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_SIDEBAR_PINNED_ITEMS) ?? [];
    const exists = current.some((p) => p.key === page.key);
    const updated = exists ? current.filter((p) => p.key !== page.key) : [...current, page];
    LOCAL_STORAGE_SERVICE.setItem(LS_KEY_SIDEBAR_PINNED_ITEMS, updated);
    emitChange();
  }, []);

  return { pinnedPages, isPinned, togglePin };
}
