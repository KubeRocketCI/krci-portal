// Load the route tree before any route module; importing a route module first trips the router's circular-import guard.
import "@/core/router";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { migratePinnedItems } from "./usePinnedItems";
import type { PinnedPage, PinTarget } from "./usePinnedItems";
import { PATH_CDPIPELINE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/details/route";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { PATH_SAST_PROJECT_DETAILS_FULL } from "@/modules/platform/security/pages/sast-project-details/route";
import { PATH_SCA_PROJECT_DETAILS_FULL } from "@/modules/platform/security/pages/sca-project-details/route";

// Helpers ----------------------------------------------------------------

function makeItem(
  overrides: Partial<PinnedPage> & { routeTo: string; routeParams?: Record<string, string> }
): PinnedPage {
  const { routeTo, routeParams = {}, ...rest } = overrides;
  return {
    key: `page:${routeTo}`,
    label: "Test",
    type: "pipelines",
    route: { to: routeTo, params: routeParams },
    ...rest,
  };
}

// ------------------------------------------------------------------------

describe("migratePinnedItems", () => {
  describe("iconType backfill", () => {
    it("leaves items that already have iconType unchanged (key recompute still runs)", () => {
      const item: PinnedPage = {
        key: "page:/c/$clusterName/cicd/pipelines",
        label: "Pipelines",
        type: "pipelines",
        iconType: "pipelines",
        route: { to: "/c/$clusterName/cicd/pipelines", params: { clusterName: "dev" } },
      };
      const result = migratePinnedItems([item]);
      expect(result).toHaveLength(1);
      expect(result[0].iconType).toBe("pipelines");
    });

    it("backfills iconType from the pathToIconType map when missing", () => {
      const item = makeItem({
        routeTo: "/c/$clusterName/cicd/pipelines",
        routeParams: { clusterName: "dev" },
        iconType: undefined,
        type: "pipelines",
      });
      const result = migratePinnedItems([item]);
      expect(result[0].iconType).toBe("pipelines");
    });

    it("backfills iconType from item.type for detail-page types", () => {
      const item = makeItem({
        routeTo: "/c/$clusterName/projects/my-app",
        routeParams: { clusterName: "dev" },
        iconType: undefined,
        type: "project",
      });
      const result = migratePinnedItems([item]);
      expect(result[0].iconType).toBe("project");
    });

    it("does not crash when iconType cannot be derived", () => {
      const item = makeItem({
        routeTo: "/c/$clusterName/some/unknown/path",
        routeParams: { clusterName: "dev" },
        iconType: undefined,
        type: "pipelines",
      });
      const result = migratePinnedItems([item]);
      expect(result).toHaveLength(1);
      expect(result[0].iconType).toBeUndefined();
    });
  });

  describe("key recomputation", () => {
    it("keeps old key intact for routes with only clusterName param (backward compatible)", () => {
      const item: PinnedPage = {
        key: "page:/c/$clusterName/cicd/pipelines",
        label: "Pipelines",
        type: "pipelines",
        iconType: "pipelines",
        route: { to: "/c/$clusterName/cicd/pipelines", params: { clusterName: "dev" } },
      };
      const result = migratePinnedItems([item]);
      expect(result[0].key).toBe("page:/c/$clusterName/cicd/pipelines");
    });

    it("rewrites old collision key to param-aware key for generic K8s list items", () => {
      // Old format: all K8s kinds shared `page:/c/$clusterName/k8s/$kind`
      const item: PinnedPage = {
        key: "page:/c/$clusterName/k8s/$kind", // old colliding key
        label: "Deployments",
        type: "deployments",
        iconType: "deployments",
        route: { to: "/c/$clusterName/k8s/$kind", params: { clusterName: "dev", kind: "deployments" } },
      };
      const result = migratePinnedItems([item]);
      expect(result[0].key).toBe("page:/c/$clusterName/k8s/$kind?kind=deployments");
    });

    it("rewrites keys for CR list items with group, version, plural params", () => {
      const item: PinnedPage = {
        key: "page:/c/$clusterName/k8s/cr/$group/$version/$plural", // old colliding key
        label: "My CRs",
        type: "pipelines",
        iconType: "pipelines",
        route: {
          to: "/c/$clusterName/k8s/cr/$group/$version/$plural",
          params: { clusterName: "dev", group: "apps", version: "v1", plural: "mycrds" },
        },
      };
      const result = migratePinnedItems([item]);
      expect(result[0].key).toBe(
        "page:/c/$clusterName/k8s/cr/$group/$version/$plural?group=apps&plural=mycrds&version=v1"
      );
    });

    it("is idempotent — already-migrated items are returned unchanged", () => {
      const item: PinnedPage = {
        key: "page:/c/$clusterName/k8s/$kind?kind=deployments",
        label: "Deployments",
        type: "deployments",
        iconType: "deployments",
        route: { to: "/c/$clusterName/k8s/$kind", params: { clusterName: "dev", kind: "deployments" } },
      };
      const first = migratePinnedItems([item]);
      const second = migratePinnedItems(first);
      expect(second[0].key).toBe("page:/c/$clusterName/k8s/$kind?kind=deployments");
      expect(second).toHaveLength(1);
    });
  });

  describe("collision deduplication", () => {
    it("preserves both items when old keys collided but params differ (distinct new keys after migration)", () => {
      // Two items stored under the same old key but with different kind params.
      const deployments: PinnedPage = {
        key: "page:/c/$clusterName/k8s/$kind",
        label: "Deployments",
        type: "deployments",
        iconType: "deployments",
        route: { to: "/c/$clusterName/k8s/$kind", params: { clusterName: "dev", kind: "deployments" } },
      };
      const statefulsets: PinnedPage = {
        key: "page:/c/$clusterName/k8s/$kind",
        label: "StatefulSets",
        type: "deployments",
        iconType: "deployments",
        route: { to: "/c/$clusterName/k8s/$kind", params: { clusterName: "dev", kind: "statefulsets" } },
      };
      const result = migratePinnedItems([deployments, statefulsets]);

      // Both get distinct keys after migration, so no deduplication needed here —
      // but let's verify both survive with correct keys.
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe("page:/c/$clusterName/k8s/$kind?kind=deployments");
      expect(result[1].key).toBe("page:/c/$clusterName/k8s/$kind?kind=statefulsets");
    });

    it("dedupes when two entries genuinely resolve to the same new key, keeping first", () => {
      // Edge case: truly identical routes stored twice (same kind, same path).
      const first: PinnedPage = {
        key: "page:/c/$clusterName/k8s/$kind",
        label: "Deployments First",
        type: "deployments",
        iconType: "deployments",
        route: { to: "/c/$clusterName/k8s/$kind", params: { clusterName: "dev", kind: "deployments" } },
      };
      const duplicate: PinnedPage = {
        key: "page:/c/$clusterName/k8s/$kind",
        label: "Deployments Duplicate",
        type: "deployments",
        iconType: "deployments",
        route: { to: "/c/$clusterName/k8s/$kind", params: { clusterName: "dev", kind: "deployments" } },
      };
      const result = migratePinnedItems([first, duplicate]);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe("Deployments First");
    });

    it("preserves items with genuinely different keys alongside deduplicated ones", () => {
      const pipelines: PinnedPage = {
        key: "page:/c/$clusterName/cicd/pipelines",
        label: "Pipelines",
        type: "pipelines",
        iconType: "pipelines",
        route: { to: "/c/$clusterName/cicd/pipelines", params: { clusterName: "dev" } },
      };
      const deployments: PinnedPage = {
        key: "page:/c/$clusterName/k8s/$kind",
        label: "Deployments",
        type: "deployments",
        iconType: "deployments",
        route: { to: "/c/$clusterName/k8s/$kind", params: { clusterName: "dev", kind: "deployments" } },
      };
      const result = migratePinnedItems([pipelines, deployments]);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe("page:/c/$clusterName/cicd/pipelines");
      expect(result[1].key).toBe("page:/c/$clusterName/k8s/$kind?kind=deployments");
    });
  });

  describe("empty and single-item inputs", () => {
    it("returns an empty array for empty input", () => {
      expect(migratePinnedItems([])).toEqual([]);
    });

    it("returns a single-item array for a single already-correct item", () => {
      const item: PinnedPage = {
        key: "page:/c/$clusterName/cicd/pipelines",
        label: "Pipelines",
        type: "pipelines",
        iconType: "pipelines",
        route: { to: "/c/$clusterName/cicd/pipelines", params: { clusterName: "dev" } },
      };
      const result = migratePinnedItems([item]);
      expect(result).toHaveLength(1);
    });
  });

  describe("iconType backfill for newly mapped paths", () => {
    it("heals items pinned before their route had an icon mapping (e.g. Trigger Bindings)", () => {
      const item = makeItem({
        routeTo: "/c/$clusterName/configuration/webhook-triggers/trigger-bindings",
        routeParams: { clusterName: "dev" },
        label: "Trigger Bindings",
        type: undefined as unknown as PinnedPage["type"],
      });

      const [migrated] = migratePinnedItems([item]);

      expect(migrated.iconType).toBe("trigger-bindings");
      expect(migrated.type).toBe("trigger-bindings");
      expect(migrated.key).toBe("page:/c/$clusterName/configuration/webhook-triggers/trigger-bindings");
    });
  });
});

// usePinnedItems -----------------------------------------------------------

const STORAGE_KEY = "sidebar_pinned_items";
const PROJECT_PATH = "/c/$clusterName/projects/$namespace/$name";
const PROJECT_KEY = "page:/c/$clusterName/projects/$namespace/$name?name=app&namespace=krci";

function projectTarget(clusterName = "dev"): PinTarget {
  return { label: "app", route: { to: PROJECT_PATH, params: { clusterName, namespace: "krci", name: "app" } } };
}

function legacyProjectEntry(): PinnedPage {
  return { key: "project:krci/app", ...projectTarget(), type: "project", iconType: "project" };
}

function stored(): PinnedPage[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
}

// The store reads localStorage once at module load, so each test seeds storage
// first and then imports a fresh copy of the module.
async function renderPinnedItems(seed?: unknown) {
  if (seed !== undefined) localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  vi.resetModules();
  const { usePinnedItems } = await import("./usePinnedItems");
  return renderHook(() => usePinnedItems());
}

describe("usePinnedItems", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("pins a target under its canonical key with the icon derived from the route", async () => {
    const { result } = await renderPinnedItems();

    act(() => result.current.togglePin(projectTarget()));

    expect(result.current.isPinned(projectTarget())).toBe(true);
    expect(stored()).toEqual([{ ...projectTarget(), key: PROJECT_KEY, type: "project", iconType: "project" }]);
  });

  // Drift guard: detail routes resolve their icon via PATH_TO_ICON_TYPE, keyed by hand-copied paths.
  it.each([
    [PATH_PROJECT_DETAILS_FULL, "project"],
    [PATH_CDPIPELINE_DETAILS_FULL, "deployment"],
    [PATH_CDPIPELINE_STAGE_DETAILS_FULL, "stage"],
    [PATH_SCA_PROJECT_DETAILS_FULL, "sca-project"],
    [PATH_SAST_PROJECT_DETAILS_FULL, "sast-project"],
  ])("derives the icon for detail route %s", async (to, iconType) => {
    const { result } = await renderPinnedItems();

    act(() => result.current.togglePin({ label: "page", route: { to, params: { clusterName: "dev" } } }));

    expect(stored()[0]).toMatchObject({ type: iconType, iconType });
  });

  it("unpins on the second toggle", async () => {
    const { result } = await renderPinnedItems();

    act(() => result.current.togglePin(projectTarget()));
    act(() => result.current.togglePin(projectTarget()));

    expect(result.current.isPinned(projectTarget())).toBe(false);
    expect(result.current.pinnedPages).toEqual([]);
    expect(stored()).toEqual([]);
  });

  it("ignores a key supplied by the caller", async () => {
    const { result } = await renderPinnedItems();
    const withForeignKey = { ...projectTarget(), key: "project:krci/app" };

    act(() => result.current.togglePin(withForeignKey));

    expect(stored()[0].key).toBe(PROJECT_KEY);
  });

  it("treats a pin as cluster-agnostic", async () => {
    const { result } = await renderPinnedItems();

    act(() => result.current.togglePin(projectTarget("dev")));

    expect(result.current.isPinned(projectTarget("prod"))).toBe(true);
  });

  it("treats a cluster-wide page as pinned in every namespace", async () => {
    const { result } = await renderPinnedItems();
    const projects = (namespace: string): PinTarget => ({
      label: "Projects",
      route: { to: "/c/$clusterName/projects", params: { clusterName: "dev", namespace } },
    });

    act(() => result.current.togglePin(projects("team-a")));

    expect(result.current.isPinned(projects("team-b"))).toBe(true);
    expect(stored()[0].key).toBe("page:/c/$clusterName/projects");
  });

  it("collapses copies of a cluster-wide page stored per namespace", async () => {
    const projects = (namespace: string): PinnedPage => ({
      key: `page:/c/$clusterName/projects?namespace=${namespace}`,
      label: "Projects",
      type: "projects",
      iconType: "projects",
      route: { to: "/c/$clusterName/projects", params: { clusterName: "dev", namespace } },
    });
    const { result } = await renderPinnedItems([projects("team-a"), projects("team-b")]);

    expect(result.current.pinnedPages.map((p) => p.key)).toEqual(["page:/c/$clusterName/projects"]);
  });

  it("reports and unpins an entry stored under a legacy key", async () => {
    const { result } = await renderPinnedItems([legacyProjectEntry()]);

    expect(result.current.isPinned(projectTarget())).toBe(true);

    act(() => result.current.togglePin(projectTarget()));

    expect(result.current.isPinned(projectTarget())).toBe(false);
    expect(stored()).toEqual([]);
  });

  it("removes legacy and canonical duplicates of the same page in one toggle", async () => {
    const canonical = { ...legacyProjectEntry(), key: PROJECT_KEY };
    const { result } = await renderPinnedItems([canonical, legacyProjectEntry()]);

    expect(result.current.pinnedPages).toHaveLength(1);

    act(() => result.current.togglePin(projectTarget()));

    expect(stored()).toEqual([]);
  });

  it("unpins an entry written to storage after the module loaded", async () => {
    const { result } = await renderPinnedItems();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacyProjectEntry()]));

    act(() => result.current.togglePin(projectTarget()));

    expect(stored()).toEqual([]);
  });

  it("reads a non-array value as no pins", async () => {
    const { result } = await renderPinnedItems({ not: "an array" });

    expect(result.current.pinnedPages).toEqual([]);
  });

  it("drops stored entries without a route", async () => {
    const { result } = await renderPinnedItems([{ key: "broken", label: "broken" }, legacyProjectEntry()]);

    expect(result.current.pinnedPages.map((p) => p.key)).toEqual([PROJECT_KEY]);
  });
});
