import { describe, expect, it } from "vitest";
import type {
  NavCollapsibleSubGroupItem,
  NavGroupItem,
  NavSubGroupItem,
  SimpleNavItem,
} from "../components/sidebar/types";
// The real, shared predicate (also used by useSidebarMenu and SidebarMenuItemWithHover).
import { isNavGroupActiveForPathname } from "../components/sidebar/utils";

const makeSimple = (matchPrefix: string): SimpleNavItem => ({
  title: matchPrefix,
  route: { to: `/${matchPrefix}`, params: {} } as unknown as SimpleNavItem["route"],
  isActiveFn: (p: string) => p.startsWith(`/${matchPrefix}`),
});

describe("isNavGroupActiveForPathname — NavCollapsibleSubGroupItem", () => {
  it("returns true when a collapsible-subgroup child's isActiveFn matches", () => {
    const collapsible: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [makeSimple("pipelines"), makeSimple("tasks")],
    };
    const group: NavGroupItem = { title: "Custom Resources", children: [collapsible] };

    expect(isNavGroupActiveForPathname(group, "/pipelines/my-run")).toBe(true);
  });

  it("returns false when no collapsible-subgroup child matches", () => {
    const collapsible: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [makeSimple("pipelines"), makeSimple("tasks")],
    };
    const group: NavGroupItem = { title: "Custom Resources", children: [collapsible] };

    expect(isNavGroupActiveForPathname(group, "/unrelated/path")).toBe(false);
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
    expect(isNavGroupActiveForPathname(group, "/pods/my-pod")).toBe(true);
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
    expect(isNavGroupActiveForPathname(group, "/pipelines/my-run")).toBe(true);
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

    expect(isNavGroupActiveForPathname(group, "/unrelated")).toBe(false);
  });
});
