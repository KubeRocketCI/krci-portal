import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TextWithTooltip } from "./index";
import { stubResizeObserver } from "@/test/utils/resize-observer";

/**
 * jsdom does not lay out text, so `scrollWidth`/`offsetWidth` are stubbed on the `<p>` and
 * every captured `ResizeObserver` callback is fired to force a re-measure.
 */

let resizeObserver: ReturnType<typeof stubResizeObserver>;

const remeasure = () => {
  act(() => {
    for (const callback of resizeObserver.callbacks) {
      callback([], {} as ResizeObserver);
    }
  });
};

const setWidths = (node: Element, scrollWidth: number, offsetWidth: number) => {
  Object.defineProperty(node, "scrollWidth", { value: scrollWidth, configurable: true });
  Object.defineProperty(node, "offsetWidth", { value: offsetWidth, configurable: true });
  remeasure();
};

const overflow = (node: Element) => setWidths(node, 300, 100);
const fit = (node: Element) => setWidths(node, 100, 100);

describe("TextWithTooltip", () => {
  beforeEach(() => {
    resizeObserver = stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders one <p> clamped at maxLineAmount, default 1", () => {
    const { container, rerender } = render(<TextWithTooltip text="a value" />);

    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(container.querySelector("p")).toHaveClass("line-clamp-1");

    rerender(<TextWithTooltip text="a value" maxLineAmount={3} />);

    expect(container.querySelector("p")).toHaveClass("line-clamp-3");
  });

  it('renders the fallback for null, undefined and empty text; stringifies a number; fallback="" renders nothing', () => {
    const { container, rerender } = render(<TextWithTooltip text={null} />);
    expect(container.querySelector("p")).toHaveTextContent("—");

    rerender(<TextWithTooltip text={undefined} />);
    expect(container.querySelector("p")).toHaveTextContent("—");

    rerender(<TextWithTooltip text="" />);
    expect(container.querySelector("p")).toHaveTextContent("—");

    rerender(<TextWithTooltip text={0} />);
    expect(container.querySelector("p")).toHaveTextContent("0");

    rerender(<TextWithTooltip text="" fallback="" />);
    expect(container.querySelector("p")).toHaveTextContent("");
  });

  it("shows no tooltip on hover when the text fits", async () => {
    const user = userEvent.setup();
    render(<TextWithTooltip text="short" />);

    await user.hover(screen.getByText("short"));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows a tooltip with the full text on hover when the text overflows", async () => {
    const user = userEvent.setup();
    const value = "a value long enough to overflow its column";
    render(<TextWithTooltip text={value} />);
    const p = screen.getByText(value);

    overflow(p);
    await user.hover(p);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(value);
  });

  it("closes the tooltip once a later measurement finds the text fits", async () => {
    const user = userEvent.setup();
    const value = "a value long enough to overflow its column";
    render(<TextWithTooltip text={value} />);
    const p = screen.getByText(value);

    overflow(p);
    await user.hover(p);
    await screen.findByRole("tooltip");

    fit(p);

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("keeps the same <p> node identity across the overflow flip", () => {
    const { container } = render(<TextWithTooltip text="a value" />);
    const before = container.querySelector("p");

    overflow(before!);

    expect(container.querySelector("p")).toBe(before);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(<TextWithTooltip text="a value" />);

    unmount();

    expect(resizeObserver.disconnect).toHaveBeenCalled();
  });
});
