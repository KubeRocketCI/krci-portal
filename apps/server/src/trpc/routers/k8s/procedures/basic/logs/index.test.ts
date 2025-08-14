import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { k8sPodLogsProcedure } from "./index";
import { createMockContext } from "@/__mocks__/context";
import * as k8s from "@kubernetes/client-node";

vi.mock("@kubernetes/client-node");

describe("k8sPodLogsProcedure", () => {
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
    vi.clearAllMocks();
  });

  it("should throw error when K8sClient is not initialized", async () => {
    mockCtx.K8sClient.KubeConfig = null;

    const input = {
      clusterName: "test-cluster",
      namespace: "default",
      podName: "test-pod",
    };

    await expect(
      k8sPodLogsProcedure({
        input,
        ctx: mockCtx,
        type: "query",
        path: "test",
        rawInput: input,
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should successfully fetch pod logs", async () => {
    const mockLog = {
      log: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(k8s.Log).mockReturnValue(mockLog as any);

    const input = {
      clusterName: "test-cluster",
      namespace: "default",
      podName: "test-pod",
      container: "test-container",
      tailLines: 100,
    };

    const result = await k8sPodLogsProcedure({
      input,
      ctx: mockCtx,
      type: "query",
      path: "test",
      rawInput: input,
    });

    expect(result).toHaveProperty("logs");
    expect(mockLog.log).toHaveBeenCalledWith(
      "default",
      "test-pod",
      "test-container",
      expect.any(Object),
      expect.objectContaining({
        follow: false,
        tailLines: 100,
      })
    );
  });
});
