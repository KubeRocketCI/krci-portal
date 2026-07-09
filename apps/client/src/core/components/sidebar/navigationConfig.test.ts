import { describe, expect, it } from "vitest";
import { PATH_TO_ICON_TYPE } from "@/core/constants/page-icons";
import { createNavigationConfig } from "./navigationConfig";

describe("navigationConfig icon coverage", () => {
  // Drift guard: pinned items resolve their icon via PATH_TO_ICON_TYPE, which is
  // maintained separately from the nav config. A nav route missing from the map
  // silently renders the generic Box icon when pinned, so fail loudly instead.
  it("every KRCI nav route has a PATH_TO_ICON_TYPE entry so pinned items keep their icons", () => {
    const items = createNavigationConfig("test-cluster", "test-namespace");

    // Recursive walk so nav items at any nesting depth (groups, sub-groups,
    // collapsible sub-groups) are covered — a fixed-depth loop would silently
    // skip routes if a deeper level is ever added.
    interface NavNode {
      route?: { to?: string };
      children?: NavNode[];
    }

    const routes: string[] = [];
    const collectRoutes = (nodes: NavNode[]) => {
      for (const node of nodes) {
        if (node.route?.to) routes.push(node.route.to);
        if (node.children?.length) collectRoutes(node.children);
      }
    };
    collectRoutes(items as NavNode[]);

    expect(routes.length).toBeGreaterThan(0);

    const missing = routes.filter((to) => !PATH_TO_ICON_TYPE[to]);
    expect(missing).toEqual([]);
  });

  it("every KRCI nav route has a PATH_TO_ICON_TYPE entry when the Administration section is included", () => {
    const items = createNavigationConfig("test-cluster", "test-namespace", true);

    interface NavNode {
      route?: { to?: string };
      children?: NavNode[];
    }

    const routes: string[] = [];
    const collectRoutes = (nodes: NavNode[]) => {
      for (const node of nodes) {
        if (node.route?.to) routes.push(node.route.to);
        if (node.children?.length) collectRoutes(node.children);
      }
    };
    collectRoutes(items as NavNode[]);

    expect(routes).toContain("/administration/audit-events");

    const missing = routes.filter((to) => !PATH_TO_ICON_TYPE[to]);
    expect(missing).toEqual([]);
  });
});

describe("createNavigationConfig — Administration section", () => {
  it("omits the Administration section by default (non-admin)", () => {
    const items = createNavigationConfig("test-cluster", "test-namespace");

    expect(items.some((item) => item.title === "Administration")).toBe(false);
  });

  it("includes the Administration section when isAdmin is true", () => {
    const items = createNavigationConfig("test-cluster", "test-namespace", true);

    expect(items.some((item) => item.title === "Administration")).toBe(true);
  });
});
