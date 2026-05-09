import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { K8sApiError } from "@my-project/shared";

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("pipelineRun.start", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: object;
    getResource: Mock;
    createResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8sClientInstance = {
      KubeConfig: {},
      getResource: vi.fn(),
      createResource: vi.fn(),
    };
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const baseInput = {
    namespace: "edp",
    pipeline: "foo-build",
  };

  const minimalPipeline = {
    apiVersion: "tekton.dev/v1",
    kind: "Pipeline",
    metadata: { name: "foo-build", namespace: "edp", labels: {} },
    spec: { params: [{ name: "git-revision", default: "main" }] },
  };

  const minimalCreatedPipelineRun = {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name: "foo-build-run-x9k2p",
      namespace: "edp",
      labels: { "app.edp.epam.com/pipelinetype": "build" },
    },
    spec: { pipelineRef: { name: "foo-build" } },
    status: {},
  };

  it("happy path — creates a PipelineRun with merged params", async () => {
    mockK8sClientInstance.getResource.mockResolvedValueOnce(minimalPipeline);
    mockK8sClientInstance.createResource.mockResolvedValueOnce(minimalCreatedPipelineRun);

    const caller = createCaller(mockContext);
    const result = await caller.pipelineRun.start({
      ...baseInput,
      params: { "git-revision": "feat-branch" },
    });

    expect(mockK8sClientInstance.getResource).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "Pipeline" }),
      "foo-build",
      "edp"
    );

    // Verify the create call carried the merged param + generateName.
    const [, , draft] = mockK8sClientInstance.createResource.mock.calls[0];
    expect((draft as { metadata: { generateName?: string; name?: string } }).metadata.generateName).toBe(
      "foo-build-run-"
    );
    expect((draft as { metadata: { name?: string } }).metadata.name).toBeUndefined();

    const params = (draft as { spec: { params: Array<{ name: string; value: unknown }> } }).spec.params;
    const gitRevision = params.find((p) => p.name === "git-revision");
    expect(gitRevision?.value).toBe("feat-branch");

    expect(result.kind).toBe("created");
    if (result.kind !== "created") throw new Error("expected created");
    expect(result.row.name).toBe("foo-build-run-x9k2p");
    expect(result.row.type).toBe("build");
  });

  it("Pipeline 404 throws NOT_FOUND with verbatim message and pipeline_not_found reason", async () => {
    mockK8sClientInstance.getResource.mockRejectedValueOnce(new K8sApiError(404, "Not Found", "{}"));

    const caller = createCaller(mockContext);
    await expect(caller.pipelineRun.start({ ...baseInput, pipeline: "ghost" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "pipeline 'ghost' not found",
      cause: { source: "k8s", reason: "pipeline_not_found" },
    });

    expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
  });

  it("Pipeline references TT but TT 404 throws NOT_FOUND with trigger_template_not_found reason", async () => {
    const pipelineWithTT = {
      ...minimalPipeline,
      metadata: {
        ...minimalPipeline.metadata,
        labels: { "app.edp.epam.com/triggertemplate": "foo-tt" },
      },
    };

    // First getResource (Pipeline) succeeds; second (TriggerTemplate) 404s.
    mockK8sClientInstance.getResource
      .mockResolvedValueOnce(pipelineWithTT)
      .mockRejectedValueOnce(new K8sApiError(404, "Not Found", "{}"));

    const caller = createCaller(mockContext);
    await expect(caller.pipelineRun.start(baseInput)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "pipeline 'foo-build' references a TriggerTemplate that does not exist",
      cause: { source: "k8s", reason: "trigger_template_not_found" },
    });

    expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
  });

  it("malformed TT label — fails fast with BAD_REQUEST, no K8s round-trip", async () => {
    const pipelineWithBadTT = {
      ...minimalPipeline,
      metadata: {
        ...minimalPipeline.metadata,
        labels: { "app.edp.epam.com/triggertemplate": "Not_A_Valid_DNS_Name!" },
      },
    };
    mockK8sClientInstance.getResource.mockResolvedValueOnce(pipelineWithBadTT);

    const caller = createCaller(mockContext);
    await expect(caller.pipelineRun.start(baseInput)).rejects.toMatchObject({
      code: "BAD_REQUEST",
      cause: { reason: "malformed_trigger_template_label" },
    });

    // Pipeline lookup happened (1 call); TT lookup did NOT.
    expect(mockK8sClientInstance.getResource).toHaveBeenCalledTimes(1);
    expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
  });

  it("trigger-template-not-found still emits in dry-run mode (Pipeline-existence + TT lookup precede dry-run short-circuit)", async () => {
    const pipelineWithTT = {
      ...minimalPipeline,
      metadata: { ...minimalPipeline.metadata, labels: { "app.edp.epam.com/triggertemplate": "foo-tt" } },
    };

    mockK8sClientInstance.getResource
      .mockResolvedValueOnce(pipelineWithTT)
      .mockRejectedValueOnce(new K8sApiError(404, "Not Found", "{}"));

    const caller = createCaller(mockContext);
    await expect(caller.pipelineRun.start({ ...baseInput, dryRun: true })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
  });

  it("RBAC denied — K8s 403 maps to FORBIDDEN", async () => {
    mockK8sClientInstance.getResource.mockResolvedValueOnce(minimalPipeline);
    mockK8sClientInstance.createResource.mockRejectedValueOnce(new K8sApiError(403, "Forbidden", "{}"));

    const caller = createCaller(mockContext);
    await expect(caller.pipelineRun.start(baseInput)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("dry-run path — returns rendered manifest, skips create", async () => {
    mockK8sClientInstance.getResource.mockResolvedValueOnce(minimalPipeline);

    const caller = createCaller(mockContext);
    const result = await caller.pipelineRun.start({
      ...baseInput,
      params: { "git-revision": "main" },
      labels: { "app.edp.epam.com/codebase": "my-app" },
      dryRun: true,
    });

    expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
    expect(result.kind).toBe("dryRun");
    if (result.kind !== "dryRun") throw new Error("expected dryRun");

    const metadata = result.manifest.metadata as { generateName?: string; labels?: Record<string, string> };
    const spec = result.manifest.spec as { params: Array<{ name: string; value: unknown }> };
    expect(metadata.generateName).toBe("foo-build-run-");
    expect(metadata.labels?.["app.edp.epam.com/codebase"]).toBe("my-app");
    expect(spec.params.find((p) => p.name === "git-revision")?.value).toBe("main");
  });

  it("generateName round-trip — response carries apiserver-assigned name", async () => {
    mockK8sClientInstance.getResource.mockResolvedValueOnce(minimalPipeline);
    mockK8sClientInstance.createResource.mockResolvedValueOnce({
      ...minimalCreatedPipelineRun,
      metadata: { ...minimalCreatedPipelineRun.metadata, name: "foo-build-run-7zxQ4" },
    });

    const caller = createCaller(mockContext);
    const result = await caller.pipelineRun.start(baseInput);

    expect(result.kind).toBe("created");
    if (result.kind !== "created") throw new Error("expected created");
    expect(result.row.name).toBe("foo-build-run-7zxQ4");
  });

  it("uninitialized K8s client — throws INTERNAL_SERVER_ERROR before any K8s call", async () => {
    mockK8sClientInstance.KubeConfig = null as unknown as object;

    const caller = createCaller(mockContext);
    await expect(caller.pipelineRun.start(baseInput)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });

    expect(mockK8sClientInstance.getResource).not.toHaveBeenCalled();
    expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
  });

  it(".strict() input rejects unknown fields", async () => {
    const caller = createCaller(mockContext);
    // @ts-expect-error — deliberately passing unknown field
    await expect(caller.pipelineRun.start({ ...baseInput, foo: "bar" })).rejects.toThrow();
  });

  it("rejects invalid pipeline name (DNS-1123)", async () => {
    const caller = createCaller(mockContext);
    await expect(caller.pipelineRun.start({ ...baseInput, pipeline: "Foo_Build" })).rejects.toThrow();
  });

  it("TT with empty resourcetemplates falls back to a minimal PipelineRun draft", async () => {
    // A TriggerTemplate that exists but carries no resourcetemplates is a
    // misconfiguration the user can still recover from — we build a minimal
    // PipelineRun pinned to the requested pipeline rather than failing the
    // start request. Dead `if (!baseDraft)` removed accordingly.
    const pipelineWithTT = {
      ...minimalPipeline,
      metadata: {
        ...minimalPipeline.metadata,
        labels: { "app.edp.epam.com/triggertemplate": "foo-tt" },
      },
    };
    const emptyTriggerTemplate = {
      apiVersion: "triggers.tekton.dev/v1beta1",
      kind: "TriggerTemplate",
      metadata: { name: "foo-tt", namespace: "edp" },
      spec: { resourcetemplates: [] },
    };

    mockK8sClientInstance.getResource.mockResolvedValueOnce(pipelineWithTT).mockResolvedValueOnce(emptyTriggerTemplate);
    mockK8sClientInstance.createResource.mockResolvedValueOnce(minimalCreatedPipelineRun);

    const caller = createCaller(mockContext);
    const result = await caller.pipelineRun.start(baseInput);

    expect(result.kind).toBe("created");
    expect(mockK8sClientInstance.createResource).toHaveBeenCalledOnce();
    const [, , draft] = mockK8sClientInstance.createResource.mock.calls[0];
    expect((draft as { spec: { pipelineRef: { name: string } } }).spec.pipelineRef.name).toBe("foo-build");
  });

  it("TT path: $(tt.params.*) placeholders resolved to Pipeline defaults before create", async () => {
    const pipelineWithTT = {
      ...minimalPipeline,
      metadata: {
        ...minimalPipeline.metadata,
        labels: { "app.edp.epam.com/triggertemplate": "image-scan-tt" },
      },
      spec: {
        params: [
          { name: "IMAGE_NAMES", type: "array" },
          { name: "CODEBASE_NAME", type: "string", default: "my-app" },
        ],
      },
    };

    const triggerTemplate = {
      apiVersion: "triggers.tekton.dev/v1beta1",
      kind: "TriggerTemplate",
      metadata: { name: "image-scan-tt", namespace: "edp" },
      spec: {
        resourcetemplates: [
          {
            apiVersion: "tekton.dev/v1",
            kind: "PipelineRun",
            metadata: { generateName: "image-scan-remote-run-" },
            spec: {
              pipelineRef: { name: "image-scan-remote" },
              params: [
                { name: "IMAGE_NAMES", value: "$(tt.params.IMAGE_NAMES)" },
                { name: "CODEBASE_NAME", value: "$(tt.params.CODEBASE_NAME)" },
              ],
            },
          },
        ],
      },
    };

    mockK8sClientInstance.getResource.mockResolvedValueOnce(pipelineWithTT).mockResolvedValueOnce(triggerTemplate);
    mockK8sClientInstance.createResource.mockResolvedValueOnce(minimalCreatedPipelineRun);

    const caller = createCaller(mockContext);
    await caller.pipelineRun.start(baseInput);

    const [, , draft] = mockK8sClientInstance.createResource.mock.calls[0];
    const params = (draft as { spec: { params: Array<{ name: string; value: unknown }> } }).spec.params;

    const imageNames = params.find((p) => p.name === "IMAGE_NAMES");
    expect(imageNames?.value).toEqual([]);

    const codebaseName = params.find((p) => p.name === "CODEBASE_NAME");
    expect(codebaseName?.value).toBe("my-app");
  });

  it("user labels override TT-seeded label values", async () => {
    const pipelineWithTT = {
      ...minimalPipeline,
      metadata: {
        ...minimalPipeline.metadata,
        labels: { "app.edp.epam.com/triggertemplate": "foo-tt" },
      },
    };

    const triggerTemplate = {
      apiVersion: "triggers.tekton.dev/v1beta1",
      kind: "TriggerTemplate",
      metadata: { name: "foo-tt", namespace: "edp" },
      spec: {
        resourcetemplates: [
          {
            apiVersion: "tekton.dev/v1",
            kind: "PipelineRun",
            metadata: {
              name: "tt-default-name",
              labels: { "app.edp.epam.com/codebase": "default-codebase" },
            },
            spec: { pipelineRef: { name: "old" }, params: [] },
          },
        ],
      },
    };

    mockK8sClientInstance.getResource.mockResolvedValueOnce(pipelineWithTT).mockResolvedValueOnce(triggerTemplate);
    mockK8sClientInstance.createResource.mockResolvedValueOnce(minimalCreatedPipelineRun);

    const caller = createCaller(mockContext);
    await caller.pipelineRun.start({
      ...baseInput,
      labels: { "app.edp.epam.com/codebase": "user-override" },
    });

    const [, , draft] = mockK8sClientInstance.createResource.mock.calls[0];
    const labels = (draft as { metadata: { labels: Record<string, string> } }).metadata.labels;
    expect(labels["app.edp.epam.com/codebase"]).toBe("user-override");
  });
});
