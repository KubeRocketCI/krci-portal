import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const searchValue: { tab?: string } = {};

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useSearch: () => searchValue,
}));

import { useDetailTabs } from "./useDetailTabs";

const TABS = ["overview", "yaml", "events"] as const;

describe("useDetailTabs", () => {
  it("defaults to the first tab when search.tab is missing", () => {
    delete searchValue.tab;
    const { result } = renderHook(() => useDetailTabs(TABS));
    expect(result.current.activeTab).toBe("overview");
    expect(result.current.activeTabIdx).toBe(0);
  });

  it("uses the search.tab value when it matches a known tab", () => {
    searchValue.tab = "yaml";
    const { result } = renderHook(() => useDetailTabs(TABS));
    expect(result.current.activeTab).toBe("yaml");
    expect(result.current.activeTabIdx).toBe(1);
  });

  it("falls back to the first tab when search.tab is unknown", () => {
    searchValue.tab = "bogus";
    const { result } = renderHook(() => useDetailTabs(TABS));
    expect(result.current.activeTab).toBe("overview");
  });

  it("setTab navigates with merged search params", () => {
    navigateMock.mockClear();
    searchValue.tab = "overview";
    const { result } = renderHook(() => useDetailTabs(TABS));
    act(() => result.current.setTab("events"));
    expect(navigateMock).toHaveBeenCalledWith({ search: { tab: "events" } });
  });

  it("onTabChange maps numeric index back to tab id", () => {
    navigateMock.mockClear();
    const { result } = renderHook(() => useDetailTabs(TABS));
    act(() => result.current.onTabChange(null, 2));
    expect(navigateMock).toHaveBeenCalledWith({ search: expect.objectContaining({ tab: "events" }) });
  });

  it("onTabChange falls back to the first tab when index is out of range", () => {
    navigateMock.mockClear();
    const { result } = renderHook(() => useDetailTabs(TABS));
    act(() => result.current.onTabChange(null, 99));
    expect(navigateMock).toHaveBeenCalledWith({ search: expect.objectContaining({ tab: "overview" }) });
  });
});
