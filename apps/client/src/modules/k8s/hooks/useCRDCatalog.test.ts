import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { CRDObject } from "@my-project/shared";

const watchMock = vi.fn();
const catalogMock = vi.fn();
vi.mock("./useCRDList", () => ({ useCRDList: () => watchMock() }));
vi.mock("./useAccessibleCRCatalog", () => ({
  useAccessibleCRCatalog: (opts: { enabled: boolean }) => catalogMock(opts),
}));

import { useCRDCatalog } from "./useCRDCatalog";

const watchCrd = { metadata: { name: "from-watch" } } as CRDObject;
const catalogCrd = { metadata: { name: "from-catalog" } } as CRDObject;

const forbiddenError = Object.assign(new Error("FORBIDDEN"), { data: { code: "FORBIDDEN" } });
const serverError = Object.assign(new Error("boom"), { data: { code: "INTERNAL_SERVER_ERROR" } });

const watchResult = (overrides: object) => ({
  data: { array: [], map: new Map() },
  isLoading: false,
  isReady: true,
  error: null,
  ...overrides,
});

const catalogResult = (overrides: object) => ({ data: [], isLoading: false, error: null, ...overrides });

describe("useCRDCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalogMock.mockReturnValue(catalogResult({}));
  });

  it("uses the CRD watch and keeps the catalog disabled when the watch succeeds (admin path)", () => {
    watchMock.mockReturnValue(watchResult({ data: { array: [watchCrd], map: new Map() } }));

    const { result } = renderHook(() => useCRDCatalog());

    expect(catalogMock).toHaveBeenCalledWith({ enabled: false });
    expect(result.current).toEqual({ data: { array: [watchCrd] }, isLoading: false, error: null });
  });

  it("falls back to the accessible-CR catalog when the watch is FORBIDDEN", () => {
    watchMock.mockReturnValue(watchResult({ error: forbiddenError }));
    catalogMock.mockReturnValue(catalogResult({ data: [catalogCrd] }));

    const { result } = renderHook(() => useCRDCatalog());

    expect(catalogMock).toHaveBeenCalledWith({ enabled: true });
    expect(result.current).toEqual({ data: { array: [catalogCrd] }, isLoading: false, error: null });
  });

  it("does NOT fall back on a non-FORBIDDEN watch error and propagates it (transient outage)", () => {
    watchMock.mockReturnValue(watchResult({ error: serverError }));

    const { result } = renderHook(() => useCRDCatalog());

    expect(catalogMock).toHaveBeenCalledWith({ enabled: false });
    expect(result.current.error).toBe(serverError);
    expect(result.current.data.array).toEqual([]);
  });

  it("surfaces the catalog error when both the watch and the fallback fail", () => {
    const catalogError = new Error("catalog failed");
    watchMock.mockReturnValue(watchResult({ error: forbiddenError }));
    catalogMock.mockReturnValue(catalogResult({ error: catalogError }));

    const { result } = renderHook(() => useCRDCatalog());

    expect(result.current.error).toBe(catalogError);
  });

  it("reports loading while the CRD watch is still pending", () => {
    watchMock.mockReturnValue(watchResult({ isLoading: true }));

    const { result } = renderHook(() => useCRDCatalog());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("reports loading while the fallback catalog is fetching", () => {
    watchMock.mockReturnValue(watchResult({ error: forbiddenError }));
    catalogMock.mockReturnValue(catalogResult({ isLoading: true }));

    const { result } = renderHook(() => useCRDCatalog());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("returns a stable identity across renders when inputs are unchanged", () => {
    const stableWatch = watchResult({ data: { array: [watchCrd], map: new Map() } });
    watchMock.mockReturnValue(stableWatch);

    const { result, rerender } = renderHook(() => useCRDCatalog());
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
