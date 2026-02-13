import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWatchCDPipelineByApplicationQuery } from "./index";
import { createTestQueryClient } from "@/test/utils";

const mockWatchListData = {
  array: [
    {
      metadata: { name: "cdp-1" },
      spec: { applications: ["app-1", "app-2"] },
    },
  ],
};
const mockUseCDPipelineWatchList = vi.fn();

vi.mock("..", () => ({
  useCDPipelineWatchList: (params: unknown) => mockUseCDPipelineWatchList(params),
}));

describe("useWatchCDPipelineByApplicationQuery", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockUseCDPipelineWatchList.mockReturnValue({
      data: mockWatchListData,
      resourceVersion: "1",
      query: { isFetched: true },
    });
  });

  it("should return query with enabled false when codebaseName or namespace is missing", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useWatchCDPipelineByApplicationQuery(undefined, "default"), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should use correct query key when enabled", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useWatchCDPipelineByApplicationQuery("app-1", "default"), { wrapper });

    expect(mockUseCDPipelineWatchList).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: "default",
        queryOptions: { enabled: true },
      })
    );
  });
});
