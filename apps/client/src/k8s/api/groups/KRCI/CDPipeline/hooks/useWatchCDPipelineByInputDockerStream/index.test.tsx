import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWatchCDPipelineByInputDockerStream } from "./index";

const mockWatchListData = {
  array: [
    {
      metadata: { name: "cdp-1" },
      spec: { inputDockerStreams: ["app-1-main", "app-2-develop"] },
    },
    {
      metadata: { name: "cdp-2" },
      spec: { inputDockerStreams: ["app-3-feature"] },
    },
  ],
};
const mockUseCDPipelineWatchList = vi.fn();

vi.mock("..", () => ({
  useCDPipelineWatchList: (params: unknown) => mockUseCDPipelineWatchList(params),
}));

describe("useWatchCDPipelineByInputDockerStream", () => {
  beforeEach(() => {
    mockUseCDPipelineWatchList.mockReturnValue({
      data: mockWatchListData,
    });
  });

  it("should return undefined data when inputDockerStream is missing", () => {
    const { result } = renderHook(() => useWatchCDPipelineByInputDockerStream(undefined, "default"));

    expect(result.current.data).toBeUndefined();
  });

  it("should disable underlying watch when no input docker stream", () => {
    renderHook(() => useWatchCDPipelineByInputDockerStream(undefined, "default"));

    expect(mockUseCDPipelineWatchList).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: "default",
        queryOptions: { enabled: false },
      })
    );
  });

  it("should return the CDPipeline whose inputDockerStreams contains the branch", () => {
    const { result } = renderHook(() => useWatchCDPipelineByInputDockerStream("app-2-develop", "default"));

    expect(result.current.data).toEqual(mockWatchListData.array[0]);
  });

  it("should return undefined data when no CDPipeline references the branch", () => {
    const { result } = renderHook(() => useWatchCDPipelineByInputDockerStream("app-99-missing", "default"));

    expect(result.current.data).toBeUndefined();
  });
});
