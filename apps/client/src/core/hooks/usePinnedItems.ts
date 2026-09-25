import { useCallback, useMemo, useSyncExternalStore } from "react";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { LS_KEY_SIDEBAR_PINNED_ITEMS } from "@/core/services/local-storage/keys";
import { PATH_TO_ICON_TYPE, getIconTypeFromPath } from "@/core/constants/page-icons";
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

/**
 * What a caller passes to pin, unpin, or query a page. The pin's identity,
 * icon, and type are derived from `route`; callers never supply them.
 */
export interface PinTarget {
  label: string;
  route: {
    to: string;
    params: Record<string, string>;
  };
}

/** A pinned page as stored and listed. Built only by this module. */
export interface PinnedPage extends PinTarget {
  /**
   * Unique, cluster-agnostic key for this pinned page, always
   * `buildPinKey(route.to, route.params)`.
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
  type: PinnedPageType;
  /** Icon type from PAGE_ICONS registry. Optional for backwards compatibility. */
  iconType?: PageIconType;
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
      // Derive iconType from the route path via the canonical map (shared with toPinnedPage).
      const iconType = PATH_TO_ICON_TYPE[item.route.to];
      if (iconType) {
        updated = { ...item, iconType, type: iconType as PinnedPageType };
      } else if (["project", "deployment", "stage", "sca-project", "sast-project"].includes(item.type)) {
        // For detail pages (project, deployment, stage, etc.) iconType matches type.
        updated = { ...item, iconType: item.type as PageIconType };
      }
    }

    // Apply the recomputed key in a single place; reuse the original reference when nothing changed.
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

function isStoredPinnedPage(item: unknown): item is PinnedPage {
  return typeof (item as PinnedPage | null)?.route?.to === "string";
}

/** Stored pins in normalized form. Non-array values and entries without a route read as absent. */
function readPinnedPages(): PinnedPage[] {
  const raw: unknown = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_SIDEBAR_PINNED_ITEMS);
  return Array.isArray(raw) ? migratePinnedItems(raw.filter(isStoredPinnedPage)) : [];
}

function toPinnedPage({ label, route }: PinTarget): PinnedPage {
  const iconType = getIconTypeFromPath(route.to);
  return {
    key: buildPinKey(route.to, route.params),
    label,
    type: iconType as PinnedPageType,
    iconType,
    route: { to: route.to, params: route.params },
  };
}

let listeners: Array<() => void> = [];
let cachedSnapshot: PinnedPage[] = readPinnedPages();

function commit(next: PinnedPage[]) {
  LOCAL_STORAGE_SERVICE.setItem(LS_KEY_SIDEBAR_PINNED_ITEMS, next);
  cachedSnapshot = next;
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
 * Pinned sidebar pages backed by localStorage, with reactive updates.
 *
 * - Identity of a pin is `buildPinKey(route.to, route.params)`; `clusterName` is ignored.
 * - `togglePin` re-reads storage, so entries written by other tabs or in legacy formats are matched.
 * - Every write persists the normalized list.
 */
export function usePinnedItems() {
  const pinnedPages = useSyncExternalStore(subscribe, getSnapshot);

  // Index keys into a Set so each row's lookup is O(1); the sidebar calls isPinned
  // once per row, so a linear scan here would be O(rows × pins) on every render.
  const pinnedKeys = useMemo(() => new Set(pinnedPages.map((p) => p.key)), [pinnedPages]);
  const isPinned = useCallback(
    (target: PinTarget) => pinnedKeys.has(buildPinKey(target.route.to, target.route.params)),
    [pinnedKeys]
  );

  const togglePin = useCallback((target: PinTarget) => {
    const page = toPinnedPage(target);
    const current = readPinnedPages();
    const exists = current.some((p) => p.key === page.key);
    commit(exists ? current.filter((p) => p.key !== page.key) : [...current, page]);
  }, []);

  return { pinnedPages, isPinned, togglePin };
}
