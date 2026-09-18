import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Tab } from "../types";
import { getTabKey, useVisitedTabs } from "./useVisitedTabs";

const tab = (id?: string): Tab => ({ id, label: id ?? "tab", component: null });

describe("getTabKey", () => {
  it("uses the id when present", () => {
    expect(getTabKey(tab("branches"), 3)).toBe("branches");
  });

  it("falls back to the index", () => {
    expect(getTabKey(tab(), 3)).toBe("idx:3");
    expect(getTabKey(undefined, 0)).toBe("idx:0");
  });
});

describe("useVisitedTabs", () => {
  const tabs = [tab("a"), tab("b"), tab("c")];

  it("marks only the initial active tab as visited", () => {
    const { result } = renderHook(() => useVisitedTabs(tabs, 1));

    expect(result.current.activeTabIdx).toBe(1);
    expect(result.current.isVisited(tabs[0], 0)).toBe(false);
    expect(result.current.isVisited(tabs[1], 1)).toBe(true);
    expect(result.current.isVisited(tabs[2], 2)).toBe(false);
  });

  it("keeps earlier tabs visited after the active tab changes", () => {
    const { result, rerender } = renderHook(({ active }) => useVisitedTabs(tabs, active), {
      initialProps: { active: 1 },
    });

    rerender({ active: 2 });

    expect(result.current.activeTabIdx).toBe(2);
    expect(result.current.isVisited(tabs[1], 1)).toBe(true);
    expect(result.current.isVisited(tabs[2], 2)).toBe(true);
    expect(result.current.isVisited(tabs[0], 0)).toBe(false);
  });

  it("resolves an undefined active tab to 0", () => {
    const { result } = renderHook(() => useVisitedTabs(tabs, undefined));

    expect(result.current.activeTabIdx).toBe(0);
    expect(result.current.isVisited(tabs[0], 0)).toBe(true);
  });

  it("tracks visits by id when tabs are reordered", () => {
    const { result, rerender } = renderHook(({ list, active }) => useVisitedTabs(list, active), {
      initialProps: { list: tabs, active: 1 },
    });

    const reordered = [tabs[1], tabs[0], tabs[2]];
    rerender({ list: reordered, active: 1 });

    expect(result.current.isVisited(reordered[0], 0)).toBe(true);
    expect(result.current.isVisited(reordered[1], 1)).toBe(true);
    expect(result.current.isVisited(reordered[2], 2)).toBe(false);
  });

  it("tracks visits by index when tabs have no id", () => {
    const anonymous = [tab(), tab(), tab()];
    const { result, rerender } = renderHook(({ active }) => useVisitedTabs(anonymous, active), {
      initialProps: { active: 0 },
    });

    rerender({ active: 2 });

    expect(result.current.isVisited(anonymous[0], 0)).toBe(true);
    expect(result.current.isVisited(anonymous[1], 1)).toBe(false);
    expect(result.current.isVisited(anonymous[2], 2)).toBe(true);
  });
});
