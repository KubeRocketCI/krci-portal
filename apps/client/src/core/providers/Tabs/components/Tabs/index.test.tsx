import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

interface RowGeometry {
  clientWidth: number;
  scrollWidth: number;
}

const ROW_RECT = { left: 0, right: 300, width: 300 } as DOMRect;

describe("Tabs scrolling", () => {
  let scrollLeft: number;
  let geometry: RowGeometry;
  let frames: FrameRequestCallback[];

  const setMatchMedia = (matches: boolean) => {
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

  const getOverlays = () => Array.from(getRow().parentElement!.querySelectorAll('[aria-hidden="true"]'));

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
    setMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows only the overlay of the side that can scroll", () => {
    renderTabs(buildTabs(probe(), probe()), 0);
    const [left, right] = getOverlays();

    expect(left).toHaveClass("opacity-0");
    expect(right).toHaveClass("opacity-100");

    scrollLeft = 600;
    act(() => {
      getRow().dispatchEvent(new Event("scroll"));
    });

    expect(left).toHaveClass("opacity-100");
    expect(right).toHaveClass("opacity-0");
  });

  it("shows no overlays when the tabs fit", () => {
    geometry = { clientWidth: 900, scrollWidth: 900 };
    renderTabs(buildTabs(probe(), probe()), 0);

    expect(getOverlays().every((overlay) => overlay.classList.contains("opacity-0"))).toBe(true);
  });

  it("scrolls right while a mouse rests in the right edge zone and stops after leaving", () => {
    renderTabs(buildTabs(probe(), probe()), 0);

    movePointer(300);
    runFrame(100);
    expect(scrollLeft).toBeCloseTo(30);

    act(() => {
      getRow().dispatchEvent(new Event("pointerleave"));
    });
    expect(frames).toHaveLength(0);
  });

  it("scrolls the active tab into view when it changes", () => {
    const tabs = buildTabs(probe(), probe());
    const { rerender } = renderTabs(tabs, 0);
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    rerender(<Tabs tabs={tabs} activeTabIdx={2} handleChangeTab={vi.fn()} />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      inline: "nearest",
      block: "nearest",
      behavior: "smooth",
    });
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts.at(-1)).toBe(
      screen.getByRole("button", { name: "Tab C" })
    );
  });

  it("scrolls a focused tab into view", () => {
    renderTabs(buildTabs(probe(), probe()), 0);
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    act(() => screen.getByRole("button", { name: "Tab B" }).focus());

    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts.at(-1)).toBe(
      screen.getByRole("button", { name: "Tab B" })
    );
  });
});
