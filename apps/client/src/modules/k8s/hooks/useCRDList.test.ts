import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/k8s/api/hooks/useWatch/useWatchList", () => ({
  useWatchList: vi.fn(() => ({
    data: { array: [], map: new Map() },
    query: { isPending: false, isSuccess: true, error: null, isError: false } as never,
    resourceVersion: "1",
    isEmpty: true,
    isLoading: false,
    isReady: true,
    error: null,
  })),
}));

import { useCRDList } from "./useCRDList";

describe("useCRDList", () => {
  it("returns the watch result for CRDs", () => {
    const { result } = renderHook(() => useCRDList());
    expect(result.current.isReady).toBe(true);
    expect(result.current.data.array).toEqual([]);
  });

  it("does NOT pass labels (watch-sharing invariant)", async () => {
    const { useWatchList } = await import("@/k8s/api/hooks/useWatch/useWatchList");
    renderHook(() => useCRDList());
    expect((useWatchList as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].labels).toBeUndefined();
  });
});
