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

const renderFades = (element: HTMLElement | null) =>
  renderHook(({ el }) => useScrollFades(el), { initialProps: { el: element } });

describe("useScrollFades", () => {
  beforeEach(() => {
    resizeObserver = stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows no fades without an element", () => {
    const { result } = renderFades(null);

    expect(result.current).toEqual({ showLeftFade: false, showRightFade: false });
  });

  it("observes the element and its children", () => {
    const container = createContainer(400, 400);
    const child = document.createElement("span");
    container.appendChild(child);

    renderFades(container);

    expect(resizeObserver.observed).toEqual([container, child]);
  });

  it("observes a child added after mount", async () => {
    const container = createContainer(400, 400);
    renderFades(container);
    const child = document.createElement("span");

    await act(async () => {
      container.appendChild(child);
    });

    expect(resizeObserver.observed).toContain(child);
  });

  it("shows the right fade once the content overflows the container", () => {
    const { result } = renderFades(createContainer(1000, 1800));

    expect(result.current).toEqual({ showLeftFade: false, showRightFade: true });
  });

  it("shows the left fade after scrolling", () => {
    const container = createContainer(1000, 1800);
    const { result } = renderFades(container);

    Object.defineProperty(container, "scrollLeft", { value: 800, configurable: true });
    act(() => {
      container.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toEqual({ showLeftFade: true, showRightFade: false });
  });

  it("picks up an element passed after the first render", () => {
    const { result, rerender } = renderFades(null);

    rerender({ el: createContainer(700, 1000) });

    expect(result.current.showRightFade).toBe(true);
  });

  it("hides the fades when the element goes away", () => {
    const { result, rerender } = renderFades(createContainer(700, 1000));

    rerender({ el: null });

    expect(result.current).toEqual({ showLeftFade: false, showRightFade: false });
  });

  it("disconnects on unmount", () => {
    const { unmount } = renderFades(createContainer(400, 400));

    unmount();

    expect(resizeObserver.disconnect).toHaveBeenCalled();
  });
});
