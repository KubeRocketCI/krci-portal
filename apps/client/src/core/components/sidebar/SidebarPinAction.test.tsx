import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "../ui/sidebar";
import { SidebarPinAction } from "./SidebarPinAction";

function wrap(ui: React.ReactNode) {
  return <SidebarProvider>{ui}</SidebarProvider>;
}

describe("SidebarPinAction", () => {
  it("renders a Pin icon when pinned", () => {
    render(wrap(<SidebarPinAction scope="menu-item" title="Pods" pinned={true} onToggle={vi.fn()} />));
    // When pinned the aria-label is "Unpin <title>"
    expect(screen.getByRole("button", { name: "Unpin Pods" })).toBeInTheDocument();
  });

  it("renders a PinOff icon when not pinned", () => {
    render(wrap(<SidebarPinAction scope="menu-item" title="Pods" pinned={false} onToggle={vi.fn()} />));
    expect(screen.getByRole("button", { name: "Pin Pods" })).toBeInTheDocument();
  });

  it("fires onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(wrap(<SidebarPinAction scope="menu-sub-item" title="Services" pinned={false} onToggle={onToggle} />));
    fireEvent.click(screen.getByRole("button", { name: "Pin Services" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("uses 'Unpin' aria-label when pinned", () => {
    render(wrap(<SidebarPinAction scope="menu-sub-item" title="Deployments" pinned={true} onToggle={vi.fn()} />));
    expect(screen.getByRole("button", { name: "Unpin Deployments" })).toBeInTheDocument();
  });

  it("applies menu-sub-item reveal classes when unpinned with scope menu-sub-item", () => {
    render(wrap(<SidebarPinAction scope="menu-sub-item" title="ConfigMaps" pinned={false} onToggle={vi.fn()} />));
    const btn = screen.getByRole("button", { name: "Pin ConfigMaps" });
    expect(btn.className).toMatch(/md:opacity-0/);
    expect(btn.className).toMatch(/group-hover\/menu-sub-item:opacity-100/);
    expect(btn.className).toMatch(/group-focus-within\/menu-sub-item:opacity-100/);
    expect(btn.className).toMatch(/data-\[state=open\]:opacity-100/);
  });

  it("applies menu-item reveal classes when unpinned with scope menu-item", () => {
    render(wrap(<SidebarPinAction scope="menu-item" title="Namespaces" pinned={false} onToggle={vi.fn()} />));
    const btn = screen.getByRole("button", { name: "Pin Namespaces" });
    expect(btn.className).toMatch(/md:opacity-0/);
    expect(btn.className).toMatch(/group-hover\/menu-item:opacity-100/);
    expect(btn.className).toMatch(/group-focus-within\/menu-item:opacity-100/);
    expect(btn.className).toMatch(/data-\[state=open\]:opacity-100/);
  });

  it("does NOT apply reveal classes when pinned (always visible)", () => {
    render(wrap(<SidebarPinAction scope="menu-item" title="Pods" pinned={true} onToggle={vi.fn()} />));
    const btn = screen.getByRole("button", { name: "Unpin Pods" });
    expect(btn.className).not.toMatch(/md:opacity-0/);
  });
});
