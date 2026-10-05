import { act, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderInActivity } from "@/test/utils/activity";
import { COPY_FEEDBACK_MS, useCopyFeedback } from "./useCopyFeedback";

function CopyProbe() {
  const { copied, markCopied } = useCopyFeedback();
  return <button onClick={markCopied}>{copied ? "copied" : "copy"}</button>;
}

describe("useCopyFeedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets copied and clears it after the reset delay", () => {
    const { result } = renderHook(() => useCopyFeedback());

    act(() => result.current.markCopied());
    expect(result.current.copied).toBe(true);

    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS - 1));
    expect(result.current.copied).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.copied).toBe(false);
  });

  it("restarts the reset delay on a repeated copy", () => {
    const { result } = renderHook(() => useCopyFeedback());

    act(() => result.current.markCopied());
    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS - 100));
    act(() => result.current.markCopied());
    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS - 100));

    expect(result.current.copied).toBe(true);
  });

  it("clears copied when a hidden tab is shown again", () => {
    const { setMode } = renderInActivity(() => <CopyProbe />);

    act(() => screen.getByRole("button").click());
    expect(screen.getByRole("button")).toHaveTextContent("copied");

    setMode("hidden");
    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS * 2));
    setMode("visible");

    expect(screen.getByRole("button")).toHaveTextContent("copy");
  });
});
