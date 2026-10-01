import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { HistoryQuery } from "../../hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "./index";

interface RenderOptions {
  visibleHistoryCount: number;
  isHistoryLoading?: boolean;
  query?: Partial<Record<string, unknown>>;
}

function renderFooter({ visibleHistoryCount, isHistoryLoading = false, query = {} }: RenderOptions) {
  const historyQuery = {
    data: { pages: [{ results: [], nextPageToken: "next" }] },
    hasNextPage: true,
    isError: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(() => new Promise(() => {})),
    refetch: vi.fn(),
    ...query,
  } as unknown as HistoryQuery;

  return {
    historyQuery,
    ...render(
      <HistoryLoadingFooter
        isHistoryLoading={isHistoryLoading}
        historyQuery={historyQuery}
        visibleHistoryCount={visibleHistoryCount}
      />
    ),
  };
}

describe("HistoryLoadingFooter", () => {
  it("offers to load older runs while pages remain", () => {
    renderFooter({ visibleHistoryCount: 2 });

    expect(screen.getByRole("button", { name: "Load older runs" })).toBeInTheDocument();
  });

  it("reports the archive end when history rows are shown", () => {
    renderFooter({ visibleHistoryCount: 2, query: { hasNextPage: false } });

    expect(screen.getByRole("status")).toHaveTextContent("All runs loaded");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing when the archive contributed nothing and is exhausted", () => {
    const { container } = renderFooter({ visibleHistoryCount: 0, query: { hasNextPage: false } });

    expect(container).toBeEmptyDOMElement();
  });

  it("shows a loading line while history loads", () => {
    renderFooter({ visibleHistoryCount: 0, isHistoryLoading: true });

    expect(screen.getByRole("status")).toHaveTextContent("Loading older runs…");
  });

  it("offers a retry when history fails", async () => {
    const { historyQuery } = renderFooter({ visibleHistoryCount: 0, query: { isError: true } });

    expect(screen.getByRole("alert")).toHaveTextContent("Older runs didn't load");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(historyQuery.refetch).toHaveBeenCalledTimes(1);
  });

  it("disables the button while older runs load", async () => {
    const { historyQuery } = renderFooter({ visibleHistoryCount: 2 });

    await userEvent.click(screen.getByRole("button", { name: "Load older runs" }));

    expect(historyQuery.fetchNextPage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
  });
});
