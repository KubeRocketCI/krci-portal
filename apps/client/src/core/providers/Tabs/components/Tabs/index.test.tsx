import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Tabs } from "./index";
import type { Tab } from "./types";

interface Probe {
  onMount: () => void;
  onCleanup: () => void;
}

function EffectProbe({ onMount, onCleanup, children }: Probe & { children: React.ReactNode }) {
  React.useEffect(() => {
    onMount();
    return onCleanup;
  }, [onMount, onCleanup]);

  return <div>{children}</div>;
}

const probe = (): Probe => ({ onMount: vi.fn(), onCleanup: vi.fn() });

const buildTabs = (b: Probe, c: Probe): Tab[] => [
  { id: "a", label: "Tab A", component: <div>Tab A body</div> },
  { id: "b", label: "Tab B", component: <EffectProbe {...b}>Tab B body</EffectProbe> },
  { id: "c", label: "Tab C", persistent: true, component: <EffectProbe {...c}>Tab C body</EffectProbe> },
];

const renderTabs = (tabs: Tab[], activeTabIdx: number, handleChangeTab = vi.fn()) =>
  render(<Tabs tabs={tabs} activeTabIdx={activeTabIdx} handleChangeTab={handleChangeTab} />);

describe("Tabs", () => {
  it("mounts only the active tab", () => {
    renderTabs(buildTabs(probe(), probe()), 0);

    expect(screen.getByText("Tab A body")).toBeVisible();
    expect(screen.queryByText("Tab B body")).not.toBeInTheDocument();
    expect(screen.queryByText("Tab C body")).not.toBeInTheDocument();
  });

  it("keeps a visited tab hidden and pauses its effects after leaving it", () => {
    const b = probe();
    const tabs = buildTabs(b, probe());
    const { rerender } = renderTabs(tabs, 0);

    rerender(<Tabs tabs={tabs} activeTabIdx={1} handleChangeTab={vi.fn()} />);
    expect(screen.getByText("Tab B body")).toBeVisible();
    expect(b.onMount).toHaveBeenCalledTimes(1);

    rerender(<Tabs tabs={tabs} activeTabIdx={0} handleChangeTab={vi.fn()} />);
    expect(screen.getByText("Tab B body")).not.toBeVisible();
    expect(b.onCleanup).toHaveBeenCalledTimes(1);

    rerender(<Tabs tabs={tabs} activeTabIdx={1} handleChangeTab={vi.fn()} />);
    expect(b.onMount).toHaveBeenCalledTimes(2);
  });

  it("never re-runs effects of a persistent tab", () => {
    const c = probe();
    const tabs = buildTabs(probe(), c);
    const { rerender } = renderTabs(tabs, 0);

    rerender(<Tabs tabs={tabs} activeTabIdx={2} handleChangeTab={vi.fn()} />);
    rerender(<Tabs tabs={tabs} activeTabIdx={0} handleChangeTab={vi.fn()} />);
    expect(screen.getByText("Tab C body").closest(".hidden")).not.toBeNull();

    rerender(<Tabs tabs={tabs} activeTabIdx={2} handleChangeTab={vi.fn()} />);
    expect(c.onMount).toHaveBeenCalledTimes(1);
    expect(c.onCleanup).not.toHaveBeenCalled();
  });

  it("reports a tab click with its index", async () => {
    const handleChangeTab = vi.fn();
    renderTabs(buildTabs(probe(), probe()), 0, handleChangeTab);

    await userEvent.click(screen.getByRole("button", { name: "Tab C" }));

    expect(handleChangeTab).toHaveBeenCalledWith(expect.anything(), 2);
  });
});
