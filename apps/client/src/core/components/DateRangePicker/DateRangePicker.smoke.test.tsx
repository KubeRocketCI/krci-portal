import { render, screen, fireEvent } from "@testing-library/react";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "./index";

describe("DateRangePicker (smoke)", () => {
  it("shows placeholder when empty and opens a day grid", () => {
    render(<DateRangePicker value={{}} onChange={vi.fn()} label="Date range" placeholder="Any time" />);

    // With a label set, the trigger's accessible name comes from the label, not the placeholder text.
    fireEvent.click(screen.getByRole("button", { name: /date range/i }));

    // A rendered grid confirms react-day-picker mounted without needing its base stylesheet.
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders the selected range label from stored ISO boundaries", () => {
    // Build boundaries the same way the component does, so the assertion is timezone-independent.
    const from = startOfDay(new Date(2026, 6, 1)).toISOString();
    const to = endOfDay(new Date(2026, 6, 8)).toISOString();
    const expected = `${format(parseISO(from), "MMM d, yyyy")} – ${format(parseISO(to), "MMM d, yyyy")}`;

    render(<DateRangePicker value={{ from, to }} onChange={vi.fn()} />);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("clears the range via a keyboard-focusable clear button", () => {
    const onChange = vi.fn();
    const from = startOfDay(new Date(2026, 6, 1)).toISOString();

    render(<DateRangePicker value={{ from }} onChange={onChange} />);

    const clear = screen.getByRole("button", { name: /clear date range/i });
    // Must be a real, focusable button (not a non-focusable span[role=button]) so keyboard/AT users can clear.
    expect(clear.tagName).toBe("BUTTON");
    expect(clear).not.toHaveAttribute("tabindex", "-1");

    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith({ from: undefined, to: undefined });
  });

  it("emits a local start-of-day ISO boundary when a day is picked", () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={{}} onChange={onChange} placeholder="Any time" />);

    fireEvent.click(screen.getByRole("button", { name: /any time/i }));
    fireEvent.click(screen.getAllByRole("gridcell")[0].querySelector("button")!);

    expect(onChange).toHaveBeenCalled();
    const { from } = onChange.mock.calls[0][0];
    // The emitted boundary must be local midnight of the clicked day, not an arbitrary time.
    expect(from).toBeTruthy();
    expect(parseISO(from).getTime()).toBe(startOfDay(parseISO(from)).getTime());
  });
});
