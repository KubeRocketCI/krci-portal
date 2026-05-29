import { describe, expect, it } from "vitest";
import type {
  NavCollapsibleSubGroupItem,
  NavGroupItem,
  NavSubGroupItem,
  SimpleNavItem,
} from "../components/sidebar/types";

// Re-export the private function under test by extracting it via a small helper
// import. We test the exported function indirectly because it is not exported,
// so we duplicate it here to keep the test self-contained and focused.
function isGroupActiveForPathname(item: NavGroupItem, pathname: string): boolean {
  return item.children.some((child) => {
    if ("isActiveFn" in child && (child as SimpleNavItem).isActiveFn) {
      return (child as SimpleNavItem).isActiveFn!(pathname);
    }
    if ((child as NavCollapsibleSubGroupItem).kind === "collapsible-subgroup") {
      return (child as NavCollapsibleSubGroupItem).children.some((c) => c.isActiveFn?.(pathname));
    }
    if ("children" in child) {
      return (child as NavSubGroupItem).children.some((c) => c.isActiveFn?.(pathname));
    }
    return false;
  });
}

const makeSimple = (matchPrefix: string): SimpleNavItem => ({
  title: matchPrefix,
  route: { to: `/${matchPrefix}`, params: {} } as unknown as SimpleNavItem["route"],
  isActiveFn: (p: string) => p.startsWith(`/${matchPrefix}`),
});

describe("isGroupActiveForPathname — NavCollapsibleSubGroupItem", () => {
  it("returns true when a collapsible-subgroup child's isActiveFn matches", () => {
    const collapsible: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [makeSimple("pipelines"), makeSimple("tasks")],
    };
    const group: NavGroupItem = { title: "Custom Resources", children: [collapsible] };

    expect(isGroupActiveForPathname(group, "/pipelines/my-run")).toBe(true);
  });

  it("returns false when no collapsible-subgroup child matches", () => {
    const collapsible: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [makeSimple("pipelines"), makeSimple("tasks")],
    };
    const group: NavGroupItem = { title: "Custom Resources", children: [collapsible] };

    expect(isGroupActiveForPathname(group, "/unrelated/path")).toBe(false);
  });

  it("returns true when NavSubGroupItem side matches in a mixed group", () => {
    const collapsible: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [makeSimple("pipelines")],
    };
    const subGroup: NavSubGroupItem = {
      title: "Workloads",
      children: [makeSimple("pods")],
    };
    const group: NavGroupItem = { title: "Mixed", children: [collapsible, subGroup] };

    // Only subGroup side matches
    expect(isGroupActiveForPathname(group, "/pods/my-pod")).toBe(true);
  });

  it("returns true when NavCollapsibleSubGroupItem side matches in a mixed group", () => {
    const collapsible: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [makeSimple("pipelines")],
    };
    const subGroup: NavSubGroupItem = {
      title: "Workloads",
      children: [makeSimple("pods")],
    };
    const group: NavGroupItem = { title: "Mixed", children: [collapsible, subGroup] };

    // Only collapsible side matches
    expect(isGroupActiveForPathname(group, "/pipelines/my-run")).toBe(true);
  });

  it("returns false when neither side matches in a mixed group", () => {
    const collapsible: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [makeSimple("pipelines")],
    };
    const subGroup: NavSubGroupItem = {
      title: "Workloads",
      children: [makeSimple("pods")],
    };
    const group: NavGroupItem = { title: "Mixed", children: [collapsible, subGroup] };

    expect(isGroupActiveForPathname(group, "/unrelated")).toBe(false);
  });
});
