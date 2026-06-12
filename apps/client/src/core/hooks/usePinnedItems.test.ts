import { describe, expect, it } from "vitest";
import { migratePinnedItems } from "./usePinnedItems";
import type { PinnedPage } from "./usePinnedItems";

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
        routeTo: "/c/$clusterName/cicd/webhook-triggers/trigger-bindings",
        routeParams: { clusterName: "dev" },
        label: "Trigger Bindings",
        type: undefined as unknown as PinnedPage["type"],
      });

      const [migrated] = migratePinnedItems([item]);

      expect(migrated.iconType).toBe("trigger-bindings");
      expect(migrated.type).toBe("trigger-bindings");
      expect(migrated.key).toBe("page:/c/$clusterName/cicd/webhook-triggers/trigger-bindings");
    });
  });
});
