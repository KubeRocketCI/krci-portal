import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { LogViewer } from "./index";

// Capture the props LazyLog is rendered with, and expose a fake virtua
// list handle via `listRef` so the scroll controls have something to call.
const scrollTo = vi.fn();
const lazyLogProps: Record<string, unknown>[] = [];

vi.mock("@melloware/react-logviewer", () => ({
  LazyLog: React.forwardRef<unknown, Record<string, unknown>>(function MockLazyLog(props, ref) {
    lazyLogProps.push(props);
    React.useImperativeHandle(ref, () => ({
      listRef: { current: { scrollTo, scrollSize: 5000 } },
      appendLines: vi.fn(),
      clear: vi.fn(),
    }));
    return <div data-testid="lazylog" />;
  }),
}));

vi.mock("@/core/hooks/useTheme", () => ({ useTheme: () => "light" }));

beforeEach(() => {
  scrollTo.mockClear();
  lazyLogProps.length = 0;
});

describe("LogViewer scroll controls", () => {
  it("renders To top / To bottom controls when static content is present", () => {
    render(<LogViewer content={"line 1\nline 2"} />);
    expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();
    expect(screen.getByLabelText("Scroll to bottom")).toBeInTheDocument();
  });

  it("does not render scroll controls when there is no content", () => {
    render(<LogViewer content="" emptyMessage="No logs" />);
    expect(screen.queryByLabelText("Scroll to top")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scroll to bottom")).not.toBeInTheDocument();
  });

  it("scrolls to the very top when To top is clicked", async () => {
    const user = userEvent.setup();
    render(<LogViewer content={"a\nb\nc"} />);
    await user.click(screen.getByLabelText("Scroll to top"));
    expect(scrollTo).toHaveBeenCalledWith(0);
  });

  it("scrolls to the very bottom (scrollSize) when To bottom is clicked", async () => {
    const user = userEvent.setup();
    render(<LogViewer content={"a\nb\nc"} />);
    await user.click(screen.getByLabelText("Scroll to bottom"));
    expect(scrollTo).toHaveBeenCalledWith(5000);
  });

  it("keeps scroll controls visible across a stream clear in streaming mode (no flicker on reload)", async () => {
    const ref = React.createRef<{ appendLines: (l: string[]) => void; clear: () => void }>();
    // renderControls keeps the toolbar row mounted (as live callers always do).
    render(<LogViewer streaming ref={ref} renderControls={() => <span>controls</span>} />);

    ref.current?.appendLines(["live line"]);
    expect(await screen.findByLabelText("Scroll to bottom")).toBeInTheDocument();

    // Switching container clears the stream — controls must NOT disappear.
    ref.current?.clear();
    expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();
    expect(screen.getByLabelText("Scroll to bottom")).toBeInTheDocument();
  });

  it("resumes auto-follow after clear() even if follow was paused (no frozen viewport on reload)", async () => {
    const user = userEvent.setup();
    const ref = React.createRef<{ appendLines: (l: string[]) => void; clear: () => void }>();
    render(<LogViewer streaming ref={ref} renderControls={() => <span>controls</span>} />);

    ref.current?.appendLines(["live line"]);
    await user.click(await screen.findByLabelText("Scroll to top"));
    expect(lazyLogProps.at(-1)?.follow).toBe(false);

    // Switching container clears the stream; follow must resume for the new one.
    ref.current?.clear();
    await waitFor(() => expect(lazyLogProps.at(-1)?.follow).toBe(true));
  });

  it("orders the toolbar: left controls → built-in controls → right-aligned controls", () => {
    render(
      <LogViewer
        content={"a\nb"}
        renderLeftControls={() => <span>LEFT</span>}
        renderControls={() => <span>RIGHT</span>}
      />
    );
    const left = screen.getByText("LEFT");
    const top = screen.getByLabelText("Scroll to top");
    const right = screen.getByText("RIGHT");
    expect(left.compareDocumentPosition(top) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(top.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("pauses follow on To top and resumes it on To bottom in streaming mode", async () => {
    const user = userEvent.setup();
    const ref = React.createRef<{ appendLines: (l: string[]) => void; clear: () => void }>();
    render(<LogViewer streaming ref={ref} />);

    // Surface streamed content so the controls render.
    ref.current?.appendLines(["live line"]);

    await user.click(await screen.findByLabelText("Scroll to top"));
    // Latest render of the streaming LazyLog should have follow disabled.
    expect(lazyLogProps.at(-1)?.follow).toBe(false);

    await user.click(screen.getByLabelText("Scroll to bottom"));
    expect(lazyLogProps.at(-1)?.follow).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith(5000);
  });
});
