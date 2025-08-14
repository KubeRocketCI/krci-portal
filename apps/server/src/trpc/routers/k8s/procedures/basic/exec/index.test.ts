import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { k8sPodExecProcedure, k8sPodAttachProcedure } from "./index";
import { createMockContext } from "@/__mocks__/context";
import * as k8s from "@kubernetes/client-node";

vi.mock("@kubernetes/client-node");

describe("k8sPodExecProcedure", () => {
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
      k8sPodExecProcedure({
        input,
        ctx: mockCtx,
        type: "mutation",
        path: "test",
        rawInput: input,
      })
    ).rejects.toThrow(TRPCError);
  });

  it("should successfully execute command in pod", async () => {
    const mockExec = {
      exec: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(k8s.Exec).mockReturnValue(mockExec as any);

    const input = {
      clusterName: "test-cluster",
      namespace: "default",
      podName: "test-pod",
      container: "test-container",
      command: ["/bin/bash"],
    };

    const result = await k8sPodExecProcedure({
      input,
      ctx: mockCtx,
      type: "mutation",
      path: "test",
      rawInput: input,
    });

    expect(result).toHaveProperty("success");
    expect(mockExec.exec).toHaveBeenCalled();
  });
});

describe("k8sPodAttachProcedure", () => {
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
    vi.clearAllMocks();
  });

  it("should successfully attach to pod", async () => {
    const mockExec = {
      exec: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(k8s.Exec).mockReturnValue(mockExec as any);

    const input = {
      clusterName: "test-cluster",
      namespace: "default",
      podName: "test-pod",
      container: "test-container",
    };

    const result = await k8sPodAttachProcedure({
      input,
      ctx: mockCtx,
      type: "mutation",
      path: "test",
      rawInput: input,
    });

    expect(result).toHaveProperty("success");
    expect(mockExec.exec).toHaveBeenCalled();
  });
});
