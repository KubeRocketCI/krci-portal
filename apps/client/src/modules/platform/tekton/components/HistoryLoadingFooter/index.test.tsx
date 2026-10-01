import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { HistoryQuery } from "../../hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "./index";

function renderFooter(visibleHistoryCount: number, query: Partial<Record<string, unknown>> = {}) {
  const historyQuery = {
    data: { pages: [{ results: [], nextPageToken: "next" }] },
    hasNextPage: true,
    isError: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(() => new Promise(() => {})),
    ...query,
  } as unknown as HistoryQuery;

  return {
    historyQuery,
    ...render(
      <HistoryLoadingFooter
        isHistoryLoading={false}
        historyQuery={historyQuery}
        visibleHistoryCount={visibleHistoryCount}
      />
    ),
  };
}

describe("HistoryLoadingFooter", () => {
  it("shows the visible history count while older pages remain", () => {
    renderFooter(2);

    expect(screen.getByRole("button", { name: "Load older runs" })).toBeInTheDocument();
    expect(screen.getByText("Showing 2 from history")).toBeInTheDocument();
  });

  it("omits the history count while no history row is shown", () => {
    renderFooter(0);

    expect(screen.getByRole("button", { name: "Load older runs" })).toBeInTheDocument();
    expect(screen.queryByText(/from history/)).not.toBeInTheDocument();
  });

  it("reports the visible history count at the end of the archive", () => {
    renderFooter(2, { hasNextPage: false });

    expect(screen.getByText("End of history · showing 2 from history")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing at the end of the archive when no history row is shown", () => {
    const { container } = renderFooter(0, { hasNextPage: false });

    expect(container).toBeEmptyDOMElement();
  });

  it("disables the button while older runs load", async () => {
    const { historyQuery } = renderFooter(2);

    await userEvent.click(screen.getByRole("button", { name: "Load older runs" }));

    expect(historyQuery.fetchNextPage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
  });
});
