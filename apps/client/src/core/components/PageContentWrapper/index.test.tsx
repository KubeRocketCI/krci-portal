import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { PageContentWrapper } from "./index";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { stubResizeObserver } from "@/test/utils/resize-observer";

/**
 * Tab content lifecycle through the real wrapper: unvisited tabs are not mounted, visited
 * tabs keep their DOM while hidden, hidden tabs pause effects, persistent tabs never do.
 */

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

const buildTabs = (b: Probe, c: Probe, onClickB = vi.fn()): Tab[] => [
  { id: "a", label: "Tab A", component: <div>Tab A body</div> },
  { id: "b", label: "Tab B", onClick: onClickB, component: <EffectProbe {...b}>Tab B body</EffectProbe> },
  { id: "c", label: "Tab C", persistent: true, component: <EffectProbe {...c}>Tab C body</EffectProbe> },
];

describe("PageContentWrapper tabs", () => {
  beforeEach(() => {
    stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mounts only the active tab", () => {
    render(<PageContentWrapper tabs={buildTabs(probe(), probe())} activeTab={0} />);

    expect(screen.getByText("Tab A body")).toBeVisible();
    expect(screen.queryByText("Tab B body")).not.toBeInTheDocument();
    expect(screen.queryByText("Tab C body")).not.toBeInTheDocument();
  });

  it("keeps a visited tab in the DOM but hidden after leaving it", () => {
    const tabs = buildTabs(probe(), probe());
    const { rerender } = render(<PageContentWrapper tabs={tabs} activeTab={0} />);

    rerender(<PageContentWrapper tabs={tabs} activeTab={1} />);
    expect(screen.getByText("Tab B body")).toBeVisible();

    rerender(<PageContentWrapper tabs={tabs} activeTab={0} />);
    expect(screen.getByText("Tab B body")).not.toBeVisible();
    expect(screen.getByText("Tab A body")).toBeVisible();
  });

  it("pauses effects of a hidden tab and resumes them on return", () => {
    const b = probe();
    const tabs = buildTabs(b, probe());
    const { rerender } = render(<PageContentWrapper tabs={tabs} activeTab={0} />);

    expect(b.onMount).not.toHaveBeenCalled();

    rerender(<PageContentWrapper tabs={tabs} activeTab={1} />);
    expect(b.onMount).toHaveBeenCalledTimes(1);
    expect(b.onCleanup).not.toHaveBeenCalled();

    rerender(<PageContentWrapper tabs={tabs} activeTab={0} />);
    expect(b.onCleanup).toHaveBeenCalledTimes(1);

    rerender(<PageContentWrapper tabs={tabs} activeTab={1} />);
    expect(b.onMount).toHaveBeenCalledTimes(2);
  });

  it("never re-runs effects of a persistent tab", () => {
    const c = probe();
    const tabs = buildTabs(probe(), c);
    const { rerender } = render(<PageContentWrapper tabs={tabs} activeTab={0} />);

    rerender(<PageContentWrapper tabs={tabs} activeTab={2} />);
    rerender(<PageContentWrapper tabs={tabs} activeTab={0} />);

    expect(screen.getByText("Tab C body").closest(".hidden")).not.toBeNull();

    rerender(<PageContentWrapper tabs={tabs} activeTab={2} />);

    expect(c.onMount).toHaveBeenCalledTimes(1);
    expect(c.onCleanup).not.toHaveBeenCalled();
    expect(screen.getByText("Tab C body").closest(".hidden")).toBeNull();
  });

  it("defaults to the first tab when activeTab is omitted", () => {
    render(<PageContentWrapper tabs={buildTabs(probe(), probe())} />);

    expect(screen.getByText("Tab A body")).toBeVisible();
    expect(screen.queryByText("Tab B body")).not.toBeInTheDocument();
  });

  it("reports a tab click to the tab and to the owner", async () => {
    const onClickB = vi.fn();
    const onTabChange = vi.fn();
    render(<PageContentWrapper tabs={buildTabs(probe(), probe(), onClickB)} activeTab={0} onTabChange={onTabChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Tab B" }));

    expect(onClickB).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(expect.anything(), 1);
  });
});
