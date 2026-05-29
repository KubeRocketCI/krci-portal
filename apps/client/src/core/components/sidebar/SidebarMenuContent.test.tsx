import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "../ui/sidebar";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    onClick,
  }: {
    children?: React.ReactNode;
    to?: string;
    onClick?: () => void;
    // Other Link props (params, activeOptions, activeProps) are intentionally ignored in tests.
    [key: string]: unknown;
  }) => (
    <a href={typeof to === "string" ? to : "#"} onClick={onClick}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: "/" }),
}));

// Pinned items hook is exercised inside SidebarSubGroupMenuItem and SidebarMenuItem; mock the
// store away so the test doesn't need real provider state.
vi.mock("@/core/hooks/usePinnedItems", () => ({
  usePinnedItems: () => ({ isPinned: () => false, togglePin: () => undefined }),
}));

import type { SimpleNavItem, NavSubGroupItem, NavCollapsibleSubGroupItem } from "./types";
import { SidebarMenuContent } from "./SidebarMenuContent";

function wrap(ui: React.ReactNode) {
  return <SidebarProvider>{ui}</SidebarProvider>;
}

function asRoute(to: string): SimpleNavItem["route"] {
  return { to, params: {} } as unknown as SimpleNavItem["route"];
}

describe("SidebarMenuContent dispatch", () => {
  it("routes a route-bearing child to SidebarMenuItem", () => {
    const child: SimpleNavItem = { title: "Pods", route: asRoute("/pods") };
    render(wrap(<SidebarMenuContent parentNavItem={{ title: "Workloads", children: [child] }} />));
    expect(screen.getByRole("link", { name: /pods/i })).toBeInTheDocument();
  });

  it("routes a NavSubGroupItem (no kind) to the static divider", () => {
    const child: NavSubGroupItem = {
      title: "argocd",
      children: [{ title: "Apps", route: asRoute("/a") }],
    };
    render(wrap(<SidebarMenuContent parentNavItem={{ title: "Custom Resources", children: [child] }} />));
    // Static divider renders the title as an uppercase label, no button role
    expect(screen.queryByRole("button", { name: /argocd/i })).not.toBeInTheDocument();
    expect(screen.getByText(/argocd/i)).toBeInTheDocument();
  });

  it("routes a collapsible-subgroup child to SidebarCollapsibleSubGroupMenuItem", () => {
    const child: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [{ title: "PipelineRuns", route: asRoute("/p") }],
    };
    render(wrap(<SidebarMenuContent parentNavItem={{ title: "Custom Resources", children: [child] }} />));
    expect(screen.getByRole("button", { name: /tekton\.dev/i })).toBeInTheDocument();
  });
});
