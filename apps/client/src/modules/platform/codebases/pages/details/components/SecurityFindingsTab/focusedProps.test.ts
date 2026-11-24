import { describe, expect, it, vi } from "vitest";
import { focusedProps } from "./focusedProps";

describe("focusedProps", () => {
  it("marks nothing for an element that is not in focus, whether or not it was asked to scroll", () => {
    expect(focusedProps(false)).toEqual({ className: undefined });
    expect(focusedProps(false, true)).toEqual({ className: undefined });
  });

  it("marks an element in focus as the current one, with a ring", () => {
    const props = focusedProps(true);

    expect(props).toMatchObject({ "data-focused": true, "aria-current": true });
    expect(props.className).toContain("ring-1");
  });

  it("scrolls only the element that is asked to, and only into view: nothing else of it changes", () => {
    expect(focusedProps(true)).toHaveProperty("ref", undefined);

    const scrolling = focusedProps(true, true);
    const element = document.createElement("tr");
    const scrollIntoView = vi.spyOn(element, "scrollIntoView").mockImplementation(() => undefined);
    if (!("ref" in scrolling) || typeof scrolling.ref !== "function") {
      throw new Error("The element asked to scroll has a ref callback");
    }
    scrolling.ref(element);

    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: "nearest" });
    expect(() => scrolling.ref?.(null)).not.toThrow();
  });
});
