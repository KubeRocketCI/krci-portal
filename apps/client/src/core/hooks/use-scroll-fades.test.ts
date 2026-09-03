import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollFades } from "./use-scroll-fades";
import { stubResizeObserver } from "@/test/utils/resize-observer";

let resizeObserver: ReturnType<typeof stubResizeObserver>;

/**
 * Refs are assigned during render here. React assigns them in the commit phase, before
 * effects run, so this reproduces the ordering the hook actually sees in `TableUI`.
 */
const renderWithRefs = (content?: HTMLElement) => {
  const container = document.createElement("div");
  return renderHook(() => {
    const fades = useScrollFades<HTMLDivElement, HTMLElement>();
    fades.scrollRef.current = container as HTMLDivElement;
    fades.contentRef.current = content ?? null;
    return fades;
  });
};

describe("useScrollFades", () => {
  beforeEach(() => {
    resizeObserver = stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("observes only the scroll container when no content element is attached", () => {
    renderWithRefs();

    expect(resizeObserver.observed).toHaveLength(1);
  });

  it("also observes the content element when a caller attaches one", () => {
    const table = document.createElement("table");
    renderWithRefs(table);

    expect(resizeObserver.observed).toHaveLength(2);
    expect(resizeObserver.observed).toContain(table);
  });

  it("disconnects on unmount", () => {
    const { unmount } = renderWithRefs(document.createElement("table"));

    unmount();

    expect(resizeObserver.disconnect).toHaveBeenCalled();
  });

  it("starts with both fades hidden", () => {
    const { result } = renderWithRefs();

    expect(result.current.showLeftFade).toBe(false);
    expect(result.current.showRightFade).toBe(false);
  });

  it("shows the right fade once the content overflows the container", () => {
    const container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 1000, configurable: true });
    Object.defineProperty(container, "scrollWidth", { value: 1800, configurable: true });

    const { result } = renderHook(() => {
      const fades = useScrollFades<HTMLDivElement>();
      fades.scrollRef.current = container as HTMLDivElement;
      return fades;
    });

    expect(result.current.showRightFade).toBe(true);
    expect(result.current.showLeftFade).toBe(false);
  });
});
