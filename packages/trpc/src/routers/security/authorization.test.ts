import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { K8sApiError, k8sCodebaseConfig, k8sStageConfig } from "@my-project/shared";
import { createMockedContext } from "../../__mocks__/context.js";
import { K8sClient } from "../../clients/k8s/index.js";
import { authorizeCodebase, authorizeStage } from "./authorization.js";

vi.mock("../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("security authorization", () => {
  const originalEnv = process.env;
  let getResource: Mock;
  let ctx: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    process.env = { ...originalEnv, DEFAULT_CLUSTER_NAMESPACE: "krci" };
    ctx = createMockedContext();
    getResource = vi.fn();
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: {}, getResource };
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("authorizeCodebase", () => {
    it("reads the Codebase in the portal namespace with the caller's session", async () => {
      getResource.mockResolvedValue({ metadata: { name: "my-service" } });

      await authorizeCodebase(ctx, "my-service");

      expect(K8sClient).toHaveBeenCalledWith(ctx.session);
      expect(getResource).toHaveBeenCalledWith(k8sCodebaseConfig, "my-service", "krci");
    });

    it("fails with FORBIDDEN when the caller may not read the Codebase", async () => {
      getResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

      await expect(authorizeCodebase(ctx, "my-service")).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("fails with NOT_FOUND and the codebase_not_found reason when the Codebase does not exist", async () => {
      getResource.mockRejectedValue(new K8sApiError(404, "Not Found", "not found"));

      await expect(authorizeCodebase(ctx, "missing")).rejects.toMatchObject({
        code: "NOT_FOUND",
        cause: { reason: "codebase_not_found" },
      });
    });

    it("fails with PRECONDITION_FAILED when the portal namespace is not configured", async () => {
      delete process.env.DEFAULT_CLUSTER_NAMESPACE;

      await expect(authorizeCodebase(ctx, "my-service")).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
      expect(getResource).not.toHaveBeenCalled();
    });
  });

  describe("authorizeStage", () => {
    const stage = { spec: { cdPipeline: "demo", name: "dev" } };

    it("reads the Stage <cdPipeline>-<stage> and returns the names of its spec", async () => {
      getResource.mockResolvedValue(stage);

      expect(await authorizeStage(ctx, "demo", "dev")).toEqual({ cdPipeline: "demo", stage: "dev" });
      expect(getResource).toHaveBeenCalledWith(k8sStageConfig, "demo-dev", "krci");
    });

    it("fails with FORBIDDEN when the caller may not read the Stage", async () => {
      getResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

      await expect(authorizeStage(ctx, "demo", "dev")).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("fails with NOT_FOUND when the Stage does not exist", async () => {
      getResource.mockRejectedValue(new K8sApiError(404, "Not Found", "not found"));

      await expect(authorizeStage(ctx, "demo", "dev")).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("fails with NOT_FOUND when the Stage of that name belongs to another CD pipeline", async () => {
      getResource.mockResolvedValue({ spec: { cdPipeline: "demo", name: "dev-2" } });

      await expect(authorizeStage(ctx, "demo-dev", "2")).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("fails with NOT_FOUND when the resource has no Stage spec", async () => {
      getResource.mockResolvedValue({ metadata: { name: "demo-dev" } });

      await expect(authorizeStage(ctx, "demo", "dev")).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("fails with PRECONDITION_FAILED when the portal namespace is not configured", async () => {
      delete process.env.DEFAULT_CLUSTER_NAMESPACE;

      await expect(authorizeStage(ctx, "demo", "dev")).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    });
  });
});
