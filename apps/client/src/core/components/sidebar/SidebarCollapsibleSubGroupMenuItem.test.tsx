import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "../ui/sidebar";
import type { NavCollapsibleSubGroupItem, SimpleNavItem } from "./types";

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

import { SidebarCollapsibleSubGroupMenuItem } from "./SidebarCollapsibleSubGroupMenuItem";

const subGroup: NavCollapsibleSubGroupItem = {
  kind: "collapsible-subgroup",
  title: "tekton.dev",
  children: [
    { title: "PipelineRuns", route: { to: "/foo", params: {} } as unknown as SimpleNavItem["route"] },
    { title: "Tasks", route: { to: "/bar", params: {} } as unknown as SimpleNavItem["route"] },
  ],
};

function harness(props: Parameters<typeof SidebarCollapsibleSubGroupMenuItem>[0]) {
  return (
    <SidebarProvider>
      <SidebarCollapsibleSubGroupMenuItem {...props} />
    </SidebarProvider>
  );
}

describe("SidebarCollapsibleSubGroupMenuItem", () => {
  it("renders the title as a clickable trigger", () => {
    render(harness({ subGroup }));
    expect(screen.getByRole("button", { name: /tekton\.dev/i })).toBeInTheDocument();
  });

  it("hides children when defaultOpen is false", () => {
    render(harness({ subGroup: { ...subGroup, defaultOpen: false } }));
    expect(screen.queryByText("PipelineRuns")).not.toBeInTheDocument();
  });

  it("shows children when defaultOpen is true", () => {
    render(harness({ subGroup: { ...subGroup, defaultOpen: true } }));
    expect(screen.getByText("PipelineRuns")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });

  it("has aria-expanded=false when collapsed", () => {
    render(harness({ subGroup }));
    expect(screen.getByRole("button", { name: /tekton\.dev/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("has aria-expanded=true when defaultOpen is true", () => {
    render(harness({ subGroup: { ...subGroup, defaultOpen: true } }));
    expect(screen.getByRole("button", { name: /tekton\.dev/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles aria-expanded on click", () => {
    render(harness({ subGroup }));
    const btn = screen.getByRole("button", { name: /tekton\.dev/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles children on trigger click", () => {
    render(harness({ subGroup }));
    fireEvent.click(screen.getByRole("button", { name: /tekton\.dev/i }));
    expect(screen.getByText("PipelineRuns")).toBeInTheDocument();
  });

  it("auto-expands and marks trigger active when a child matches isActiveFn", async () => {
    vi.resetModules();
    vi.doMock("@tanstack/react-router", () => ({
      Link: ({
        children,
        to,
        onClick,
      }: {
        children?: React.ReactNode;
        to?: string;
        onClick?: () => void;
        [key: string]: unknown;
      }) => (
        <a href={typeof to === "string" ? to : "#"} onClick={onClick}>
          {children}
        </a>
      ),
      useLocation: () => ({ pathname: "/c/c1/k8s/cr/tekton.dev/v1/pipelineruns" }),
    }));
    const { SidebarCollapsibleSubGroupMenuItem: Reloaded } = await import("./SidebarCollapsibleSubGroupMenuItem");
    const activeSubGroup: NavCollapsibleSubGroupItem = {
      kind: "collapsible-subgroup",
      title: "tekton.dev",
      children: [
        {
          title: "PipelineRuns",
          route: { to: "/foo", params: {} } as unknown as SimpleNavItem["route"],
          isActiveFn: (p: string) => p.includes("pipelineruns"),
        },
      ],
    };

    render(
      <SidebarProvider>
        <Reloaded subGroup={activeSubGroup} />
      </SidebarProvider>
    );

    // Auto-expanded (child visible)
    expect(screen.getByText("PipelineRuns")).toBeInTheDocument();
    // Trigger button carries the active styling class
    const trigger = screen.getByRole("button", { name: /tekton\.dev/i });
    expect(trigger.className).toMatch(/bg-accent/);
  });
});
