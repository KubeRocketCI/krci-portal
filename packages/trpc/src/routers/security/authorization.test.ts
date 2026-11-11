import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  K8sApiError,
  k8sCDPipelineConfig,
  k8sCodebaseConfig,
  k8sCodebaseImageStreamConfig,
  k8sStageConfig,
} from "@my-project/shared";
import { createMockedContext } from "../../__mocks__/context.js";
import { K8sClient } from "../../clients/k8s/index.js";
import {
  authorizeCodebase,
  authorizeStage,
  listCodebaseEnvironments,
  listCodebaseImageStreams,
} from "./authorization.js";

vi.mock("../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("security authorization", () => {
  const originalEnv = process.env;
  let getResource: Mock;
  let listResource: Mock;
  let ctx: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    process.env = { ...originalEnv, DEFAULT_CLUSTER_NAMESPACE: "krci" };
    ctx = createMockedContext();
    getResource = vi.fn();
    listResource = vi.fn();
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: {}, getResource, listResource };
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

    it("reads the Stage <cdPipeline>-<stage> and returns what its spec and status say", async () => {
      getResource.mockResolvedValue({
        spec: { cdPipeline: "demo", name: "dev", namespace: "krci-demo-dev", clusterName: "eks-sandbox" },
        status: { available: true },
      });

      expect(await authorizeStage(ctx, "demo", "dev")).toEqual({
        cdPipeline: "demo",
        stage: "dev",
        clusterName: "eks-sandbox",
        namespace: "krci-demo-dev",
        available: true,
      });
      expect(getResource).toHaveBeenCalledWith(k8sStageConfig, "demo-dev", "krci");
    });

    it("reports a Stage with no cluster name, namespace or status as unavailable", async () => {
      getResource.mockResolvedValue(stage);

      expect(await authorizeStage(ctx, "demo", "dev")).toEqual({
        cdPipeline: "demo",
        stage: "dev",
        clusterName: "",
        namespace: "",
        available: false,
      });
    });

    it.each([[{ available: false }], [{}], [null]])(
      "reports a Stage with the status %j as unavailable",
      async (status) => {
        getResource.mockResolvedValue({ ...stage, status });

        expect((await authorizeStage(ctx, "demo", "dev")).available).toBe(false);
      }
    );

    it("fails with FORBIDDEN when the caller may not read the Stage", async () => {
      getResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

      await expect(authorizeStage(ctx, "demo", "dev")).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("fails with NOT_FOUND and the stage_not_found reason when the Stage does not exist", async () => {
      getResource.mockRejectedValue(new K8sApiError(404, "Not Found", "not found"));

      await expect(authorizeStage(ctx, "demo", "dev")).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "stage 'dev' of CD pipeline 'demo' not found",
        cause: { reason: "stage_not_found" },
      });
    });

    it("fails with NOT_FOUND when the Stage of that name belongs to another CD pipeline", async () => {
      getResource.mockResolvedValue({ spec: { cdPipeline: "demo", name: "dev-2" } });

      await expect(authorizeStage(ctx, "demo-dev", "2")).rejects.toMatchObject({
        code: "NOT_FOUND",
        cause: { reason: "stage_not_found" },
      });
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

  describe("listCodebaseEnvironments", () => {
    function cdPipeline(name: string, applications: string[] | null) {
      return { metadata: { name }, spec: { applications } };
    }

    function stageOf(cdPipelineName: string, name: string, overrides: Record<string, unknown> = {}) {
      return {
        spec: {
          cdPipeline: cdPipelineName,
          name,
          namespace: `krci-${cdPipelineName}-${name}`,
          clusterName: "in-cluster",
        },
        status: { available: true },
        ...overrides,
      };
    }

    function answer(cdPipelines: unknown[], stages: unknown[]) {
      listResource.mockImplementation(async (config: { kind: string }) => ({
        items: config.kind === "CDPipeline" ? cdPipelines : stages,
      }));
    }

    it("lists the CD pipelines in the portal namespace with the caller's session", async () => {
      answer([], []);

      await listCodebaseEnvironments(ctx, "my-service");

      expect(K8sClient).toHaveBeenCalledWith(ctx.session);
      expect(listResource).toHaveBeenCalledWith(k8sCDPipelineConfig, "krci", "");
    });

    it("lists the Stages of the CD pipelines that deploy the codebase", async () => {
      answer(
        [cdPipeline("demo", ["my-service", "other"]), cdPipeline("edge", ["my-service"]), cdPipeline("lab", ["other"])],
        [stageOf("demo", "dev"), stageOf("demo", "qa"), stageOf("edge", "prod", { status: { available: false } })]
      );

      const stages = await listCodebaseEnvironments(ctx, "my-service");

      expect(listResource).toHaveBeenCalledTimes(2);
      expect(listResource).toHaveBeenCalledWith(
        k8sStageConfig,
        "krci",
        "app.edp.epam.com/cdPipelineName in (demo,edge)"
      );
      expect(stages).toEqual([
        { cdPipeline: "demo", stage: "dev", clusterName: "in-cluster", namespace: "krci-demo-dev", available: true },
        { cdPipeline: "demo", stage: "qa", clusterName: "in-cluster", namespace: "krci-demo-qa", available: true },
        { cdPipeline: "edge", stage: "prod", clusterName: "in-cluster", namespace: "krci-edge-prod", available: false },
      ]);
    });

    it("does not list Stages when no CD pipeline deploys the codebase", async () => {
      answer([cdPipeline("lab", ["other"]), cdPipeline("none", null)], [stageOf("lab", "dev")]);

      expect(await listCodebaseEnvironments(ctx, "my-service")).toEqual([]);
      expect(listResource).toHaveBeenCalledTimes(1);
    });

    it("leaves out a Stage that its spec does not assign to one of the CD pipelines", async () => {
      answer([cdPipeline("demo", ["my-service"])], [stageOf("demo", "dev"), stageOf("lab", "dev")]);

      expect((await listCodebaseEnvironments(ctx, "my-service")).map(({ cdPipeline: name }) => name)).toEqual(["demo"]);
    });

    it("leaves out the items that are not CD pipelines or Stages", async () => {
      answer(
        [cdPipeline("demo", ["my-service"]), { metadata: {} }, "nope"],
        [stageOf("demo", "dev"), { spec: {} }, null]
      );

      expect(await listCodebaseEnvironments(ctx, "my-service")).toHaveLength(1);
    });

    it("answers no Stages when the caller may not list CD pipelines", async () => {
      listResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

      expect(await listCodebaseEnvironments(ctx, "my-service")).toEqual([]);
    });

    it("answers no Stages when the caller may not list Stages", async () => {
      listResource.mockImplementation(async (config: { kind: string }) => {
        if (config.kind === "Stage") {
          throw new K8sApiError(403, "Forbidden", "forbidden");
        }

        return { items: [cdPipeline("demo", ["my-service"])] };
      });

      expect(await listCodebaseEnvironments(ctx, "my-service")).toEqual([]);
    });

    it("fails on any other error", async () => {
      listResource.mockRejectedValue(new K8sApiError(500, "Server Error", "boom"));

      await expect(listCodebaseEnvironments(ctx, "my-service")).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    });

    it("fails on a truncated list rather than answering with part of it", async () => {
      listResource.mockResolvedValue({ items: [], metadata: { continue: "next" } });

      await expect(listCodebaseEnvironments(ctx, "my-service")).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    });

    it("fails with PRECONDITION_FAILED when the portal namespace is not configured", async () => {
      delete process.env.DEFAULT_CLUSTER_NAMESPACE;

      await expect(listCodebaseEnvironments(ctx, "my-service")).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
      expect(listResource).not.toHaveBeenCalled();
    });
  });

  describe("listCodebaseImageStreams", () => {
    it("lists every CodebaseImageStream of the portal namespace with the caller's session, keeping the codebase and the image", async () => {
      listResource.mockResolvedValue({
        items: [
          { metadata: { name: "checkout-main" }, spec: { codebase: "checkout", imageName: "r.io/checkout", tags: [] } },
          { spec: {} },
          null,
        ],
      });

      expect(await listCodebaseImageStreams(ctx)).toEqual([
        { spec: { codebase: "checkout", imageName: "r.io/checkout" } },
      ]);

      expect(K8sClient).toHaveBeenCalledWith(ctx.session);
      expect(listResource).toHaveBeenCalledWith(k8sCodebaseImageStreamConfig, "krci", "");
    });

    it("is undefined when the caller may not list the image streams", async () => {
      listResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

      expect(await listCodebaseImageStreams(ctx)).toBeUndefined();
    });

    it("fails on any other error", async () => {
      listResource.mockRejectedValue(new K8sApiError(503, "Unavailable", "down"));

      await expect(listCodebaseImageStreams(ctx)).rejects.toBeDefined();
    });

    it("fails with PRECONDITION_FAILED when the portal namespace is not configured", async () => {
      delete process.env.DEFAULT_CLUSTER_NAMESPACE;

      await expect(listCodebaseImageStreams(ctx)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    });
  });
});
