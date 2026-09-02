import { TIME_RANGES } from "@my-project/shared";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseParams = vi.fn();
const mockUseSearch = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../route", () => ({
  PATH_PIPELINE_METRICS_FULL: "/c/$clusterName/observability/pipeline-metrics/$namespace",
  routePipelineMetrics: {
    useParams: () => mockUseParams(),
    useSearch: () => mockUseSearch(),
  },
}));

import { usePipelineMetricsFilters } from "./usePipelineMetricsFilters";

function lastNavigateCall(prev: Record<string, unknown> = {}): {
  replace?: boolean;
  search: Record<string, unknown>;
} {
  const calls = mockNavigate.mock.calls;
  const arg = calls[calls.length - 1]?.[0];
  const search = typeof arg.search === "function" ? arg.search(prev) : arg.search;
  return { replace: arg.replace, search };
}

describe("usePipelineMetricsFilters", () => {
  beforeEach(() => {
    mockUseParams.mockReset();
    mockUseSearch.mockReset();
    mockNavigate.mockReset();
    mockUseParams.mockReturnValue({ namespace: "edp-delivery" });
  });

  it("falls back to today when the URL carries no time range", () => {
    mockUseSearch.mockReturnValue({});
    const { result } = renderHook(() => usePipelineMetricsFilters());
    expect(result.current.filters).toEqual({
      namespace: "edp-delivery",
      codebase: undefined,
      timeRange: TIME_RANGES.TODAY,
    });
  });

  it("passes the URL values through to the filters", () => {
    mockUseSearch.mockReturnValue({ codebase: "my-app", timeRange: TIME_RANGES.MONTH });
    const { result } = renderHook(() => usePipelineMetricsFilters());
    expect(result.current.filters).toEqual({
      namespace: "edp-delivery",
      codebase: "my-app",
      timeRange: TIME_RANGES.MONTH,
    });
  });

  it("setCodebase writes ?codebase and keeps other params", () => {
    mockUseSearch.mockReturnValue({});
    const { result } = renderHook(() => usePipelineMetricsFilters());
    act(() => result.current.setCodebase("my-app"));
    expect(lastNavigateCall({ timeRange: TIME_RANGES.WEEK }).search).toEqual({
      codebase: "my-app",
      timeRange: TIME_RANGES.WEEK,
    });
  });

  it("setCodebase(undefined) drops the key so the link means all codebases", () => {
    mockUseSearch.mockReturnValue({ codebase: "my-app" });
    const { result } = renderHook(() => usePipelineMetricsFilters());
    act(() => result.current.setCodebase(undefined));
    expect(lastNavigateCall({ codebase: "my-app" }).search).toEqual({});
  });

  it('setCodebase("") drops the key, matching the all-codebases sentinel', () => {
    mockUseSearch.mockReturnValue({ codebase: "my-app" });
    const { result } = renderHook(() => usePipelineMetricsFilters());
    act(() => result.current.setCodebase(""));
    expect(lastNavigateCall({ codebase: "my-app" }).search).toEqual({});
  });

  it("setTimeRange writes a non-default range", () => {
    mockUseSearch.mockReturnValue({});
    const { result } = renderHook(() => usePipelineMetricsFilters());
    act(() => result.current.setTimeRange(TIME_RANGES.QUARTER));
    expect(lastNavigateCall({ codebase: "my-app" }).search).toEqual({
      codebase: "my-app",
      timeRange: TIME_RANGES.QUARTER,
    });
  });

  it("setTimeRange omits the default range so plain links stay short", () => {
    mockUseSearch.mockReturnValue({ timeRange: TIME_RANGES.MONTH });
    const { result } = renderHook(() => usePipelineMetricsFilters());
    act(() => result.current.setTimeRange(TIME_RANGES.TODAY));
    expect(lastNavigateCall({ codebase: "my-app", timeRange: TIME_RANGES.MONTH }).search).toEqual({
      codebase: "my-app",
    });
  });

  it("both setters use replace to keep history clean", () => {
    mockUseSearch.mockReturnValue({});
    const { result } = renderHook(() => usePipelineMetricsFilters());

    act(() => result.current.setCodebase("my-app"));
    expect(lastNavigateCall().replace).toBe(true);

    act(() => result.current.setTimeRange(TIME_RANGES.WEEK));
    expect(lastNavigateCall().replace).toBe(true);
  });

  it("does not mutate the previous search object", () => {
    mockUseSearch.mockReturnValue({ codebase: "my-app" });
    const { result } = renderHook(() => usePipelineMetricsFilters());
    const prev = { codebase: "my-app" };
    act(() => result.current.setCodebase("other-app"));
    lastNavigateCall(prev);
    expect(prev).toEqual({ codebase: "my-app" });
  });
});
