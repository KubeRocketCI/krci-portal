import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { TabBar } from "./index";
import { EDGE_SCROLL_DELAY_MS } from "./constants";

const TAB_WIDTH = 200;
const ROW_WIDTH = 300;

const buildTabs = (onClick = vi.fn()): Tab[] => [
  { id: "a", label: "Tab A", component: null, onClick },
  { id: "b", label: "Tab B", component: null },
  { id: "c", label: "Tab C", component: null },
];

describe("TabBar", () => {
  let scrollLeft: number;
  let contentWidth: number;
  let frames: FrameRequestCallback[];
  let scrollTo: ReturnType<typeof vi.fn>;

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

  const getFades = () => {
    const [left, right] = Array.from(getRow().parentElement!.querySelectorAll('[aria-hidden="true"]'));

    return { left, right };
  };

  const movePointer = (clientX: number, pointerType = "mouse") => {
    const event = new MouseEvent("pointermove", { clientX, bubbles: true });
    Object.defineProperty(event, "pointerType", { value: pointerType });
    act(() => {
      getRow().dispatchEvent(event);
    });
  };

  const leaveRow = () =>
    act(() => {
      getRow().dispatchEvent(new Event("pointerleave"));
    });

  const runFrame = (timestamp: number) => {
    const frame = frames.shift();
    act(() => frame?.(timestamp));
  };

  const renderTabBar = (activeIndex = 0, onChange = vi.fn(), tabs = buildTabs()) =>
    render(<TabBar tabs={tabs} activeIndex={activeIndex} onChange={onChange} />);

  beforeEach(() => {
    scrollLeft = 0;
    contentWidth = 3 * TAB_WIDTH;
    frames = [];
    scrollTo = vi.fn();

    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => ROW_WIDTH);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => contentWidth);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(() => scrollLeft);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "set").mockImplementation((value: number) => {
      scrollLeft = value;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.tagName !== "BUTTON") {
        return { left: 0, right: ROW_WIDTH, width: ROW_WIDTH } as DOMRect;
      }

      const left = Array.from(this.parentElement!.children).indexOf(this) * TAB_WIDTH - scrollLeft;

      return { left, right: left + TAB_WIDTH, width: TAB_WIDTH } as DOMRect;
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { value: scrollTo, configurable: true });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", () => {
      frames = [];
    });
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    setReducedMotion(false);
  });

  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("tabs", () => {
    it("marks the active tab", () => {
      renderTabBar(1);

      expect(screen.getByRole("button", { name: "Tab B" })).toHaveClass("text-primary");
      expect(screen.getByRole("button", { name: "Tab A" })).not.toHaveClass("text-primary");
    });

    it("calls the tab's own handler, then reports the index", async () => {
      const calls: string[] = [];
      const onChange = vi.fn(() => calls.push("onChange"));
      renderTabBar(1, onChange, buildTabs(vi.fn(() => calls.push("tab"))));

      await userEvent.click(screen.getByRole("button", { name: "Tab A" }));

      expect(onChange).toHaveBeenCalledWith(0);
      expect(calls).toEqual(["tab", "onChange"]);
    });
  });

  describe("fades", () => {
    it("shows only the fade of the side that can scroll", () => {
      renderTabBar();
      const { left, right } = getFades();

      expect(left).toHaveClass("opacity-0");
      expect(right).toHaveClass("opacity-100");

      scrollLeft = contentWidth - ROW_WIDTH;
      act(() => {
        getRow().dispatchEvent(new Event("scroll"));
      });

      expect(left).toHaveClass("opacity-100");
      expect(right).toHaveClass("opacity-0");
    });

    it("shows no fades when the tabs fit", () => {
      contentWidth = ROW_WIDTH;
      renderTabBar();
      const { left, right } = getFades();

      expect(left).toHaveClass("opacity-0");
      expect(right).toHaveClass("opacity-0");
    });
  });

  describe("edge auto-scroll", () => {
    it("scrolls only after the mouse dwells in the edge zone", () => {
      renderTabBar();

      movePointer(ROW_WIDTH);
      runFrame(0);
      runFrame(EDGE_SCROLL_DELAY_MS - 1);
      expect(scrollLeft).toBe(0);

      runFrame(EDGE_SCROLL_DELAY_MS + 15);
      expect(scrollLeft).toBe(10);
    });

    it("does not scroll when the mouse passes through the zone", () => {
      renderTabBar();

      movePointer(ROW_WIDTH);
      runFrame(0);
      movePointer(ROW_WIDTH / 2);
      runFrame(100);
      movePointer(ROW_WIDTH);
      runFrame(200);
      runFrame(EDGE_SCROLL_DELAY_MS + 100);

      expect(scrollLeft).toBe(0);
    });

    it("stops after the mouse leaves the row", () => {
      renderTabBar();

      movePointer(ROW_WIDTH);
      runFrame(0);
      leaveRow();

      expect(frames).toHaveLength(0);
    });

    it("scrolls left from the left edge", () => {
      scrollLeft = 200;
      renderTabBar();

      movePointer(0);
      runFrame(0);
      runFrame(EDGE_SCROLL_DELAY_MS - 1);
      runFrame(EDGE_SCROLL_DELAY_MS + 15);

      expect(scrollLeft).toBe(190);
    });

    it("does not scroll towards an edge that is already reached", () => {
      renderTabBar();

      movePointer(0);

      expect(frames).toHaveLength(0);
    });

    it("ignores touch input", () => {
      renderTabBar();

      movePointer(ROW_WIDTH, "touch");

      expect(frames).toHaveLength(0);
    });

    it("does not scroll when the tabs fit", () => {
      contentWidth = ROW_WIDTH;
      renderTabBar();

      movePointer(ROW_WIDTH);

      expect(frames).toHaveLength(0);
    });

    it("is off under reduced motion", () => {
      setReducedMotion(true);
      renderTabBar();

      movePointer(ROW_WIDTH);

      expect(frames).toHaveLength(0);
    });
  });

  describe("active tab", () => {
    it("is revealed instantly on mount", () => {
      renderTabBar(2);

      expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: contentWidth - ROW_WIDTH, behavior: "auto" });
    });

    it("is revealed smoothly when it changes", () => {
      const tabs = buildTabs();
      const { rerender } = renderTabBar(0, vi.fn(), tabs);
      expect(scrollTo).not.toHaveBeenCalled();

      rerender(<TabBar tabs={tabs} activeIndex={2} onChange={vi.fn()} />);

      expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: contentWidth - ROW_WIDTH, behavior: "smooth" });
    });

    it("is revealed instantly under reduced motion", () => {
      setReducedMotion(true);
      const tabs = buildTabs();
      const { rerender } = renderTabBar(0, vi.fn(), tabs);

      rerender(<TabBar tabs={tabs} activeIndex={2} onChange={vi.fn()} />);

      expect(scrollTo).toHaveBeenCalledWith({ left: contentWidth - ROW_WIDTH, behavior: "auto" });
    });

    it("does not scroll when the tabs fit", () => {
      contentWidth = ROW_WIDTH;
      renderTabBar(2);

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it("reveals a focused tab instantly", () => {
      renderTabBar();

      act(() => screen.getByRole("button", { name: "Tab C" }).focus());

      expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: contentWidth - ROW_WIDTH, behavior: "auto" });
    });

    it("does not move a tab focused by a pointer press until the press ends", () => {
      renderTabBar();
      const tab = screen.getByRole("button", { name: "Tab C" });

      act(() => {
        tab.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        tab.focus();
      });
      expect(scrollTo).not.toHaveBeenCalled();

      act(() => {
        window.dispatchEvent(new Event("pointerup"));
        tab.blur();
        tab.focus();
      });
      expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: contentWidth - ROW_WIDTH, behavior: "auto" });
    });

    it("activates a partly hidden tab on click", async () => {
      const onChange = vi.fn();
      renderTabBar(0, onChange);

      await userEvent.click(screen.getByRole("button", { name: "Tab C" }));

      expect(onChange).toHaveBeenCalledWith(2);
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it("does not scroll for a focused tab that is already in view", () => {
      renderTabBar();

      act(() => screen.getByRole("button", { name: "Tab A" }).focus());

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it("never scrolls the page", () => {
      renderTabBar(2);

      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
