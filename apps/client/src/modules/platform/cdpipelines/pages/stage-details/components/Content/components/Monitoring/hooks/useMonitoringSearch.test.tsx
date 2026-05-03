import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockUseSearch = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/modules/platform/cdpipelines/pages/stage-details/route", () => ({
  routeStageDetails: {
    fullPath: "/_layout/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/$stage",
    useSearch: () => mockUseSearch(),
  },
}));

import { useMonitoringSearch } from "./useMonitoringSearch";

function lastNavigateCall(): { replace?: boolean; search: Record<string, unknown> } {
  const calls = mockNavigate.mock.calls;
  const arg = calls[calls.length - 1]?.[0];
  const search = typeof arg.search === "function" ? arg.search({}) : arg.search;
  return { replace: arg.replace, search };
}

function lastNavigateSearch(): Record<string, unknown> {
  return lastNavigateCall().search;
}

describe("useMonitoringSearch", () => {
  beforeEach(() => {
    mockUseSearch.mockReset();
    mockNavigate.mockReset();
  });

  it("returns null apps when ?apps is absent", () => {
    mockUseSearch.mockReturnValue({});
    const { result } = renderHook(() => useMonitoringSearch());
    expect(result.current.apps).toBeNull();
    expect(result.current.range).toBe("1h");
    expect(result.current.autoRefresh).toBe(true);
  });

  it("returns null apps when ?apps is empty string", () => {
    mockUseSearch.mockReturnValue({ apps: "" });
    const { result } = renderHook(() => useMonitoringSearch());
    expect(result.current.apps).toBeNull();
  });

  it("parses comma-separated ?apps", () => {
    mockUseSearch.mockReturnValue({ apps: "frontend,api" });
    const { result } = renderHook(() => useMonitoringSearch());
    expect(result.current.apps).toEqual(["frontend", "api"]);
  });

  it("setRange writes ?range as a deliberate navigation (replace:false)", () => {
    mockUseSearch.mockReturnValue({});
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.setRange("6h"));
    expect(lastNavigateCall().replace).toBe(false);
    expect(lastNavigateSearch()).toMatchObject({ range: "6h" });
  });

  it("setAutoRefresh uses replace:true to keep history clean", () => {
    mockUseSearch.mockReturnValue({});
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.setAutoRefresh(false));
    expect(lastNavigateCall().replace).toBe(true);
    expect(lastNavigateSearch()).toMatchObject({ autoRefresh: false });
  });

  it("setApps and isolateApp do not use replace:true", () => {
    mockUseSearch.mockReturnValue({ apps: "a,b" });
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.setApps(["a"]));
    expect(lastNavigateCall().replace).toBe(false);
    act(() => result.current.isolateApp("b"));
    expect(lastNavigateCall().replace).toBe(false);
  });

  it.each([
    ["leading/trailing whitespace", "  a  , b ", ["a", "b"]],
    ["only commas", ",,,", null],
    ["only whitespace", "   ", null],
  ])("parseApps handles %s", (_label, raw, expected) => {
    mockUseSearch.mockReturnValue({ apps: raw });
    const { result } = renderHook(() => useMonitoringSearch());
    expect(result.current.apps).toEqual(expected);
  });

  it("setApps([]) clears the URL key", () => {
    mockUseSearch.mockReturnValue({ apps: "frontend" });
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.setApps([]));
    expect(lastNavigateSearch()).toMatchObject({ apps: undefined });
  });

  it("clearApps resets the URL key without going through serializeApps", () => {
    mockUseSearch.mockReturnValue({ apps: "a,b" });
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.clearApps());
    expect(lastNavigateCall().replace).toBe(false);
    expect(lastNavigateSearch()).toMatchObject({ apps: undefined });
  });

  it("setApps(['a','b']) joins with commas", () => {
    mockUseSearch.mockReturnValue({});
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.setApps(["a", "b"]));
    expect(lastNavigateSearch()).toMatchObject({ apps: "a,b" });
  });

  it("toggleApp adds when not present", () => {
    mockUseSearch.mockReturnValue({ apps: "a" });
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.toggleApp("b"));
    expect(lastNavigateSearch()).toMatchObject({ apps: "a,b" });
  });

  it("toggleApp removes when present", () => {
    mockUseSearch.mockReturnValue({ apps: "a,b" });
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.toggleApp("a"));
    expect(lastNavigateSearch()).toMatchObject({ apps: "b" });
  });

  it("toggleApp on the last selected app resets to all (apps undefined)", () => {
    mockUseSearch.mockReturnValue({ apps: "a" });
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.toggleApp("a"));
    expect(lastNavigateSearch()).toMatchObject({ apps: undefined });
  });

  it("isolateApp sets apps to just that app", () => {
    mockUseSearch.mockReturnValue({ apps: "a,b,c" });
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.isolateApp("b"));
    expect(lastNavigateSearch()).toMatchObject({ apps: "b" });
  });

  it("isolateApp on the already-isolated app resets to all", () => {
    mockUseSearch.mockReturnValue({ apps: "b" });
    const { result } = renderHook(() => useMonitoringSearch());
    act(() => result.current.isolateApp("b"));
    expect(lastNavigateSearch()).toMatchObject({ apps: undefined });
  });
});
