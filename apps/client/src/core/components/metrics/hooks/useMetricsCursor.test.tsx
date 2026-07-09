import { describe, expect, it } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import { useMetricsCursor } from "./useMetricsCursor";
import { MetricsCursorProvider } from "./MetricsCursorProvider";

describe("useMetricsCursor", () => {
  it("returns null cursorTs by default", () => {
    const { result } = renderHook(() => useMetricsCursor(), {
      wrapper: ({ children }) => <MetricsCursorProvider>{children}</MetricsCursorProvider>,
    });
    expect(result.current.cursorTs).toBeNull();
  });

  it("setCursorTs notifies subscribers", () => {
    const { result } = renderHook(() => useMetricsCursor(), {
      wrapper: ({ children }) => <MetricsCursorProvider>{children}</MetricsCursorProvider>,
    });
    act(() => result.current.setCursorTs(1700000000));
    expect(result.current.cursorTs).toBe(1700000000);
    act(() => result.current.setCursorTs(null));
    expect(result.current.cursorTs).toBeNull();
  });

  it("setting the same value does not re-render (identity check)", () => {
    let renders = 0;
    function Probe() {
      const { cursorTs, setCursorTs } = useMetricsCursor();
      renders++;
      return <button onClick={() => setCursorTs(42)}>{String(cursorTs)}</button>;
    }
    const { getByRole } = render(
      <MetricsCursorProvider>
        <Probe />
      </MetricsCursorProvider>
    );
    const initial = renders;
    act(() => getByRole("button").click());
    const afterFirst = renders;
    act(() => getByRole("button").click());
    expect(renders).toBe(afterFirst); // second click sets same value, no re-render
    expect(afterFirst).toBeGreaterThan(initial);
  });

  it("returns null cursor and no-op setter outside the provider", () => {
    const { result } = renderHook(() => useMetricsCursor());
    expect(result.current.cursorTs).toBeNull();
    expect(() => act(() => result.current.setCursorTs(42))).not.toThrow();
    // Setter is a no-op, so cursorTs stays null after a "set".
    expect(result.current.cursorTs).toBeNull();
  });
});
