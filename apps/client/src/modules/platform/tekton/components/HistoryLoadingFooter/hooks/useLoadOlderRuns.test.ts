import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { HistoryPage, HistoryQuery } from "../../../hooks/useUnifiedPipelineRunList";
import { MAX_PAGES_PER_LOAD, useLoadOlderRuns } from "./useLoadOlderRuns";

interface TestState {
  pages: HistoryPage[];
  hasNextPage: boolean;
  isError: boolean;
  visible: number;
}

const page = (): HistoryPage => ({ results: [], nextPageToken: "next" });

function setup() {
  const pendingFetches: Array<(result: unknown) => void> = [];
  const fetchNextPage = vi.fn(() => new Promise((resolve) => pendingFetches.push(resolve)));

  let state: TestState = { pages: [page()], hasNextPage: true, isError: false, visible: 0 };

  const toQuery = ({ pages, hasNextPage, isError }: TestState) =>
    ({ data: { pages }, hasNextPage, isError, isFetchingNextPage: false, fetchNextPage }) as unknown as HistoryQuery;

  const hook = renderHook(
    (props: TestState) => useLoadOlderRuns({ historyQuery: toQuery(props), visibleHistoryCount: props.visible }),
    { initialProps: state }
  );

  const render = (next: Partial<TestState> = {}) => {
    state = { ...state, ...next };
    hook.rerender(state);
  };

  const renderLandedPage = (next: Partial<TestState> = {}) => render({ pages: [...state.pages, page()], ...next });

  const settleFetch = async ({ pageAdded }: { pageAdded: boolean }) => {
    const pages = pageAdded ? [...state.pages, page()] : state.pages;
    await act(async () => {
      pendingFetches.shift()?.({ data: { pages } });
    });
  };

  const click = () => act(() => hook.result.current.loadOlderRuns());

  return { hook, fetchNextPage, render, renderLandedPage, settleFetch, click };
}

describe("useLoadOlderRuns", () => {
  it("stops once a page adds a visible row", () => {
    const { hook, fetchNextPage, renderLandedPage, click } = setup();

    click();
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isLoadingOlderRuns).toBe(true);

    renderLandedPage({ visible: 3 });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isLoadingOlderRuns).toBe(false);
  });

  it("keeps fetching while pages add no visible row, up to MAX_PAGES_PER_LOAD pages", () => {
    const { hook, fetchNextPage, renderLandedPage, click } = setup();

    click();
    for (let i = 0; i < MAX_PAGES_PER_LOAD; i++) renderLandedPage();

    expect(fetchNextPage).toHaveBeenCalledTimes(MAX_PAGES_PER_LOAD);
    expect(hook.result.current.isLoadingOlderRuns).toBe(false);
  });

  it("starts a fresh page budget on the next click", () => {
    const { hook, fetchNextPage, renderLandedPage, click } = setup();

    click();
    for (let i = 0; i < MAX_PAGES_PER_LOAD; i++) renderLandedPage();
    click();
    renderLandedPage();

    expect(fetchNextPage).toHaveBeenCalledTimes(MAX_PAGES_PER_LOAD + 2);
    expect(hook.result.current.isLoadingOlderRuns).toBe(true);
  });

  it("waits for the fetched page to render before deciding", async () => {
    const { hook, fetchNextPage, renderLandedPage, settleFetch, click } = setup();

    click();
    await settleFetch({ pageAdded: true });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isLoadingOlderRuns).toBe(true);

    renderLandedPage({ visible: 1 });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isLoadingOlderRuns).toBe(false);
  });

  it("stops when the fetch finishes without adding a page", async () => {
    const { hook, fetchNextPage, settleFetch, click } = setup();

    click();
    await settleFetch({ pageAdded: false });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isLoadingOlderRuns).toBe(false);
  });

  it("stops at the end of the archive", () => {
    const { hook, fetchNextPage, renderLandedPage, click } = setup();

    click();
    renderLandedPage({ hasNextPage: false });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isLoadingOlderRuns).toBe(false);
  });

  it("stops when the query fails", () => {
    const { hook, fetchNextPage, render, click } = setup();

    click();
    render({ isError: true });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isLoadingOlderRuns).toBe(false);
  });

  it("stops when a filter change resets the query", () => {
    const { hook, fetchNextPage, render, click } = setup();

    click();
    render({ pages: [page()] });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isLoadingOlderRuns).toBe(false);
  });

  it("ignores a fetch that finishes after a newer request started", async () => {
    const { hook, fetchNextPage, render, settleFetch, click } = setup();

    click();
    render({ pages: [page()] });
    click();
    await settleFetch({ pageAdded: false });

    expect(fetchNextPage).toHaveBeenCalledTimes(2);
    expect(hook.result.current.isLoadingOlderRuns).toBe(true);
  });
});
