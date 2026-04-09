import { useCallback, useSyncExternalStore } from "react";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { LS_KEY_SIDEBAR_PINNED_ITEMS } from "@/core/services/local-storage/keys";
import type { PageIconType } from "@/core/constants/page-icons";

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
  /** Unique key in the format `"type:namespace/name"` (or `"type:namespace/parent/name"` for stages). */
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
 * Migrate old pinned items to add iconType field.
 * Maps route paths to correct icon types.
 */
function migratePinnedItems(items: PinnedPage[]): PinnedPage[] {
  const pathToIconType: Record<string, PageIconType> = {
    "/c/$clusterName/overview/$namespace": "overview",
    "/c/$clusterName/projects": "projects",
    "/c/$clusterName/cdpipelines": "deployments",
    "/c/$clusterName/cicd/pipelineruns": "pipelineruns",
    "/c/$clusterName/cicd/pipelines": "pipelines",
    "/c/$clusterName/cicd/tasks": "tasks",
    "/c/$clusterName/observability/pipeline-metrics": "pipeline-metrics",
    "/c/$clusterName/security/sca/$namespace": "sca",
    "/c/$clusterName/security/sca-projects/$namespace": "sca-projects",
    "/c/$clusterName/security/sast/$namespace": "sast",
  };

  return items.map((item) => {
    // If iconType already exists, keep as is
    if (item.iconType) return item;

    // Derive iconType from route path
    const iconType = pathToIconType[item.route.to];
    if (iconType) {
      return { ...item, iconType, type: iconType as PinnedPageType };
    }

    // For detail pages (project, deployment, stage), iconType matches type
    if (["project", "deployment", "stage", "sca-project", "sast-project"].includes(item.type)) {
      return { ...item, iconType: item.type as PageIconType };
    }

    return item;
  });
}

let listeners: Array<() => void> = [];
const rawSnapshot = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_SIDEBAR_PINNED_ITEMS) ?? [];
let cachedSnapshot: PinnedPage[] = migratePinnedItems(rawSnapshot);

// Save migrated items back to localStorage only if migration actually occurred
const needsMigration = rawSnapshot.some((item: PinnedPage) => !item.iconType);
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
