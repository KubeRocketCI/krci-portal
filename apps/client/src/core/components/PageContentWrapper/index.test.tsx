import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

const ROW_RECT = { left: 0, right: 300, width: 300 } as DOMRect;

describe("PageContentWrapper tab row scrolling", () => {
  let scrollLeft: number;
  let geometry: { clientWidth: number; scrollWidth: number };
  let frames: FrameRequestCallback[];

  const setReducedMotion = (matches: boolean) => {
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string) =>
        ({
          matches,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList
    );
  };

  const getRow = () => screen.getByRole("button", { name: "Tab A" }).parentElement as HTMLElement;

  const getFades = () => Array.from(getRow().parentElement!.querySelectorAll(".bg-gradient-to-r, .bg-gradient-to-l"));

  const movePointer = (clientX: number, pointerType = "mouse") => {
    const event = new MouseEvent("pointermove", { clientX, bubbles: true });
    Object.defineProperty(event, "pointerType", { value: pointerType });
    act(() => {
      getRow().dispatchEvent(event);
    });
  };

  const runFrame = (timestamp: number) => {
    const frame = frames.shift();
    act(() => frame?.(timestamp));
  };

  beforeEach(() => {
    scrollLeft = 0;
    geometry = { clientWidth: 300, scrollWidth: 900 };
    frames = [];

    stubResizeObserver();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => geometry.clientWidth);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => geometry.scrollWidth);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(() => scrollLeft);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "set").mockImplementation((value: number) => {
      scrollLeft = value;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(ROW_RECT);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", () => {
      frames = [];
    });
    vi.spyOn(performance, "now").mockReturnValue(0);
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("scrolls right while a mouse rests near the right edge and stops after leaving", () => {
    render(<PageContentWrapper tabs={buildTabs(probe(), probe())} activeTab={0} />);

    movePointer(300);
    runFrame(100);
    expect(scrollLeft).toBeCloseTo(30);

    act(() => {
      getRow().dispatchEvent(new Event("pointerleave"));
    });
    expect(frames).toHaveLength(0);
  });

  it("scrolls when the row mounts after the first render", () => {
    const tabs = buildTabs(probe(), probe());
    const { rerender } = render(<PageContentWrapper title="Details" tabs={[]} />);

    rerender(<PageContentWrapper title="Details" tabs={tabs} activeTab={0} />);
    movePointer(300);

    expect(frames).toHaveLength(1);
  });

  it("shows the right fade when the row mounts after the first render", () => {
    const tabs = buildTabs(probe(), probe());
    const { rerender } = render(<PageContentWrapper title="Details" tabs={[]} />);

    rerender(<PageContentWrapper title="Details" tabs={tabs} activeTab={0} />);

    expect(getFades()).toHaveLength(1);
    expect(getFades()[0]).toHaveClass("bg-gradient-to-l");
  });

  it("does not scroll when the tabs fit", () => {
    geometry = { clientWidth: 900, scrollWidth: 900 };
    render(<PageContentWrapper tabs={buildTabs(probe(), probe())} activeTab={0} />);

    movePointer(900);

    expect(frames).toHaveLength(0);
    expect(scrollLeft).toBe(0);
    expect(getFades()).toHaveLength(0);
  });

  it("does not scroll under reduced motion", () => {
    setReducedMotion(true);
    render(<PageContentWrapper tabs={buildTabs(probe(), probe())} activeTab={0} />);

    movePointer(300);

    expect(frames).toHaveLength(0);
    expect(scrollLeft).toBe(0);
  });

  it("scrolls the active tab into view", () => {
    render(<PageContentWrapper tabs={buildTabs(probe(), probe())} activeTab={2} />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      inline: "nearest",
      block: "nearest",
      behavior: "smooth",
    });
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts.at(-1)).toBe(
      screen.getByRole("button", { name: "Tab C" })
    );
  });

  it("does not scroll the active tab into view when the tabs fit", () => {
    geometry = { clientWidth: 900, scrollWidth: 900 };

    render(<PageContentWrapper tabs={buildTabs(probe(), probe())} activeTab={2} />);

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls a focused tab into view", () => {
    render(<PageContentWrapper tabs={buildTabs(probe(), probe())} activeTab={0} />);
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    act(() => screen.getByRole("button", { name: "Tab B" }).focus());

    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts.at(-1)).toBe(
      screen.getByRole("button", { name: "Tab B" })
    );
  });
});
