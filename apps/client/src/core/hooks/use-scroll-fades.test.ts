import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useScrollFades } from "./use-scroll-fades";
import { stubResizeObserver } from "@/test/utils/resize-observer";

let resizeObserver: ReturnType<typeof stubResizeObserver>;

const createContainer = (clientWidth: number, scrollWidth: number) => {
  const container = document.createElement("div");
  Object.defineProperty(container, "clientWidth", { value: clientWidth, configurable: true });
  Object.defineProperty(container, "scrollWidth", { value: scrollWidth, configurable: true });

  return container;
};

describe("useScrollFades", () => {
  beforeEach(() => {
    resizeObserver = stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts with both fades hidden and no element", () => {
    const { result } = renderHook(() => useScrollFades<HTMLDivElement>());

    expect(result.current.scrollElement).toBeNull();
    expect(result.current.showLeftFade).toBe(false);
    expect(result.current.showRightFade).toBe(false);
  });

  it("observes only the container when no content element is attached", () => {
    const { result } = renderHook(() => useScrollFades<HTMLDivElement>());

    act(() => result.current.scrollRef(createContainer(400, 400)));

    expect(resizeObserver.observed).toHaveLength(1);
  });

  it("also observes the children and the content element", () => {
    const container = createContainer(400, 400);
    const child = document.createElement("span");
    container.appendChild(child);
    const table = document.createElement("table");
    const { result } = renderHook(() => useScrollFades<HTMLDivElement, HTMLTableElement>());

    act(() => {
      result.current.scrollRef(container);
      result.current.contentRef(table);
    });

    expect(resizeObserver.observed).toContain(container);
    expect(resizeObserver.observed).toContain(child);
    expect(resizeObserver.observed).toContain(table);
  });

  it("shows the right fade once the content overflows the container", () => {
    const { result } = renderHook(() => useScrollFades<HTMLDivElement>());

    act(() => result.current.scrollRef(createContainer(1000, 1800)));

    expect(result.current.showRightFade).toBe(true);
    expect(result.current.showLeftFade).toBe(false);
  });

  it("picks up an element attached after the first render", () => {
    const { result, rerender } = renderHook(() => useScrollFades<HTMLDivElement>());
    rerender();
    expect(result.current.showRightFade).toBe(false);

    act(() => result.current.scrollRef(createContainer(700, 1000)));

    expect(result.current.scrollElement).not.toBeNull();
    expect(result.current.showRightFade).toBe(true);
  });

  it("hides the fades when the element detaches", () => {
    const { result } = renderHook(() => useScrollFades<HTMLDivElement>());
    act(() => result.current.scrollRef(createContainer(700, 1000)));

    act(() => result.current.scrollRef(null));

    expect(result.current.showRightFade).toBe(false);
  });

  it("disconnects on unmount", () => {
    const { result, unmount } = renderHook(() => useScrollFades<HTMLDivElement>());
    act(() => result.current.scrollRef(createContainer(400, 400)));

    unmount();

    expect(resizeObserver.disconnect).toHaveBeenCalled();
  });
});
