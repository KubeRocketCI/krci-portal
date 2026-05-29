import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { getInitializedK8sClient } from "./index.js";
import type { CustomSession } from "../../../../context/types.js";

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("getInitializedK8sClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the K8sClient when KubeConfig is initialized", () => {
    const instance = { KubeConfig: {} };
    (K8sClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => instance);

    const ctx = { session: {} as CustomSession };
    expect(getInitializedK8sClient(ctx)).toBe(instance);
  });

  it("throws a TRPCError when KubeConfig is null", () => {
    (K8sClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({ KubeConfig: null }));

    const ctx = { session: {} as CustomSession };
    expect(() => getInitializedK8sClient(ctx)).toThrow(TRPCError);
  });

  it("forwards the session through to the K8sClient constructor", () => {
    const ctorSpy = vi.fn(() => ({ KubeConfig: {} }));
    (K8sClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(ctorSpy);

    const session = { foo: "bar" } as unknown as CustomSession;
    getInitializedK8sClient({ session });
    expect(ctorSpy).toHaveBeenCalledWith(session);
  });
});
