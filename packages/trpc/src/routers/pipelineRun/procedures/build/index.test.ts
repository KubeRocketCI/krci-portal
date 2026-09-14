import { createMockPipelineRun, K8sApiError, pipelineType } from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

const NAMESPACE = "edp";
const CODEBASE = "my-app";
const BRANCH = "main";
const CODEBASE_BRANCH_NAME = "my-app-main-a1b2c";
const BUILD_PIPELINE = "github-maven-app-build-default";

const BRANCH_SELECTOR = `app.edp.epam.com/codebaseName=${CODEBASE}`;
const RUN_SELECTOR = `app.edp.epam.com/pipelinetype=build,app.edp.epam.com/codebasebranch=${CODEBASE_BRANCH_NAME}`;

const makeCodebase = () => ({
  apiVersion: "v2.edp.epam.com/v1",
  kind: "Codebase",
  metadata: { name: CODEBASE, namespace: NAMESPACE },
  spec: {
    buildTool: "maven",
    ciTool: "tekton",
    commitMessagePattern: "",
    defaultBranch: BRANCH,
    gitServer: "github",
    gitUrlPath: "/my-org/my-app",
  },
});

const makeCodebaseBranch = () => ({
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CodebaseBranch",
  metadata: {
    name: CODEBASE_BRANCH_NAME,
    namespace: NAMESPACE,
    labels: { "app.edp.epam.com/codebaseName": CODEBASE },
  },
  spec: { branchName: BRANCH, codebaseName: CODEBASE, pipelines: { build: BUILD_PIPELINE } },
  status: { status: "created" },
});

const codebaseWithSpec = (spec: Record<string, unknown>) => {
  const codebase = makeCodebase();
  return { ...codebase, spec: { ...codebase.spec, ...spec } };
};

const codebaseBranchWith = (patch: { metadata?: Record<string, unknown>; spec?: Record<string, unknown> }) => {
  const branch = makeCodebaseBranch();
  return { ...branch, metadata: { ...branch.metadata, ...patch.metadata }, spec: { ...branch.spec, ...patch.spec } };
};

const makeGitServer = () => ({
  apiVersion: "v2.edp.epam.com/v1",
  kind: "GitServer",
  metadata: { name: "github", namespace: NAMESPACE },
  spec: { gitHost: "github.com", gitProvider: "github", gitUser: "git", sshPort: 22 },
});

const makeTriggerTemplate = () => ({
  apiVersion: "triggers.tekton.dev/v1beta1",
  kind: "TriggerTemplate",
  metadata: { name: "github-build-template", namespace: NAMESPACE },
  spec: {
    params: [{ name: "serviceAccount", default: "tekton" }],
    resourcetemplates: [
      {
        apiVersion: "tekton.dev/v1",
        kind: "PipelineRun",
        metadata: {
          generateName: "$(tt.params.codebasebranch)-build-",
          labels: { "app.edp.epam.com/pipelinetype": "build" },
        },
        spec: {
          pipelineRef: { name: "$(tt.params.pipelineName)" },
          params: [
            { name: "image-tag", value: "latest" },
            { name: "git-source-url", value: "$(tt.params.gitrepo)" },
            { name: "CODEBASE_NAME", value: "$(tt.params.codebase)" },
          ],
          taskRunTemplate: { serviceAccountName: "tekton" },
        },
      },
    ],
  },
});

const makePipeline = () => ({
  apiVersion: "tekton.dev/v1",
  kind: "Pipeline",
  metadata: { name: BUILD_PIPELINE, namespace: NAMESPACE, annotations: {} },
  spec: {},
});

const makeCreatedRun = () => ({
  apiVersion: "tekton.dev/v1",
  kind: "PipelineRun",
  metadata: {
    name: `build-${CODEBASE_BRANCH_NAME}-x9k2p`,
    namespace: NAMESPACE,
    labels: {
      "app.edp.epam.com/pipelinetype": "build",
      "app.edp.epam.com/codebase": CODEBASE,
    },
  },
  spec: {},
  status: {},
});

const makeBranchRun = (status: "running" | "succeeded") =>
  createMockPipelineRun({
    name: `build-${CODEBASE_BRANCH_NAME}-${status}`,
    namespace: NAMESPACE,
    pipelineType: pipelineType.build,
    status,
  });

/**
 * A resource entry is the object the apiserver returns, an Error the stub
 * throws, or `undefined` for "does not exist" (404).
 */
type ResourceEntry = unknown;

interface Scenario {
  resources?: Record<string, ResourceEntry>;
  codebaseBranches?: unknown[];
  branchListContinue?: string;
  pipelineRuns?: unknown[];
  runListContinue?: string;
}

type MockK8sClient = {
  KubeConfig: object;
  getResource: Mock;
  listResource: Mock;
  createResource: Mock;
};

let mockContext: ReturnType<typeof createMockedContext>;
let k8s: MockK8sClient;

/** Dispatches by resource kind, not call order. Lookups may run in any order. */
function primeK8sClient(scenario: Scenario = {}) {
  const resources: Record<string, ResourceEntry> = {
    Codebase: makeCodebase(),
    GitServer: makeGitServer(),
    TriggerTemplate: makeTriggerTemplate(),
    Pipeline: makePipeline(),
    ...scenario.resources,
  };

  const codebaseBranches = scenario.codebaseBranches ?? [makeCodebaseBranch()];
  const pipelineRuns = scenario.pipelineRuns ?? [];

  k8s.getResource.mockImplementation(async (config: { kind: string }) => {
    const entry = resources[config.kind];

    if (entry instanceof Error) {
      throw entry;
    }

    if (entry === undefined) {
      throw new K8sApiError(404, "Not Found", "{}");
    }

    return entry;
  });

  k8s.listResource.mockImplementation(async (config: { kind: string }) => {
    if (config.kind === "CodebaseBranch") {
      return {
        items: codebaseBranches,
        metadata: scenario.branchListContinue ? { continue: scenario.branchListContinue } : {},
      };
    }

    return {
      items: pipelineRuns,
      metadata: scenario.runListContinue ? { continue: scenario.runListContinue } : {},
    };
  });

  k8s.createResource.mockResolvedValue(makeCreatedRun());
}

interface BuildInputOverrides {
  codebase?: string;
  branch?: string;
  params?: Record<string, string>;
  dryRun?: boolean;
}

const buildInput = (overrides: BuildInputOverrides = {}) => ({
  namespace: NAMESPACE,
  codebase: CODEBASE,
  ...overrides,
});

const createdDraft = () => k8s.createResource.mock.calls[0][2] as Record<string, unknown>;

describe("pipelineRun.build", () => {
  beforeEach(() => {
    mockContext = createMockedContext();
    k8s = {
      KubeConfig: {},
      getResource: vi.fn(),
      listResource: vi.fn(),
      createResource: vi.fn(),
    };
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return k8s;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("create path", () => {
    it("creates a build PipelineRun and returns the projected row", async () => {
      primeK8sClient();

      const caller = createCaller(mockContext);
      const result = await caller.pipelineRun.build(buildInput({ branch: BRANCH }));

      expect(result.kind).toBe("created");
      if (result.kind !== "created") throw new Error("expected created");
      expect(result.row.name).toBe(`build-${CODEBASE_BRANCH_NAME}-x9k2p`);
      expect(result.row.project).toBe(CODEBASE);
      expect(result.row.type).toBe("build");
    });

    it("resolves the branch from codebase.spec.defaultBranch when none is given", async () => {
      primeK8sClient();

      const caller = createCaller(mockContext);
      const result = await caller.pipelineRun.build(buildInput());

      expect(result.kind).toBe("created");
      expect(k8s.createResource).toHaveBeenCalledOnce();
    });

    it("hands createResource a manifest with identity labels, generateName and pinned namespace", async () => {
      primeK8sClient();

      const caller = createCaller(mockContext);
      await caller.pipelineRun.build(buildInput({ branch: BRANCH }));

      const draft = createdDraft();
      const metadata = draft.metadata as {
        name?: string;
        generateName?: string;
        namespace?: string;
        labels?: Record<string, string>;
      };

      expect(metadata.name).toBeUndefined();
      expect(metadata.generateName).toBe(`build-${CODEBASE_BRANCH_NAME}-`);
      expect(metadata.namespace).toBe(NAMESPACE);
      expect(metadata.labels).toMatchObject({
        "app.edp.epam.com/codebase": CODEBASE,
        "app.edp.epam.com/codebasebranch": CODEBASE_BRANCH_NAME,
        "app.edp.epam.com/pipelinetype": "build",
      });
    });

    it("keeps generateName within the 63-char PipelineRun name budget", async () => {
      const longBranchName = `${CODEBASE}-feature-${"x".repeat(63)}`.slice(0, 63);
      primeK8sClient({
        codebaseBranches: [codebaseBranchWith({ metadata: { name: longBranchName } })],
      });

      const caller = createCaller(mockContext);
      await caller.pipelineRun.build(buildInput({ branch: BRANCH }));

      const metadata = createdDraft().metadata as { generateName: string };

      expect(metadata.generateName).toBe(`build-${longBranchName.slice(0, 51)}-`);
      expect(metadata.generateName.length + 5).toBeLessThanOrEqual(63);
    });

    it("merges a non-managed param over the template default and sorts params", async () => {
      primeK8sClient();

      const caller = createCaller(mockContext);
      await caller.pipelineRun.build(buildInput({ branch: BRANCH, params: { "image-tag": "v1.2.3" } }));

      const spec = createdDraft().spec as { params: Array<{ name: string; value: unknown }> };

      expect(spec.params.find((p) => p.name === "image-tag")?.value).toBe("v1.2.3");

      const names = spec.params.map((p) => p.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    it("lists CodebaseBranches and build runs with the contracted label selectors", async () => {
      primeK8sClient();

      const caller = createCaller(mockContext);
      await caller.pipelineRun.build(buildInput({ branch: BRANCH }));

      expect(k8s.listResource).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "CodebaseBranch" }),
        NAMESPACE,
        BRANCH_SELECTOR
      );
      expect(k8s.listResource).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "PipelineRun" }),
        NAMESPACE,
        RUN_SELECTOR
      );
    });

    it("ignores finished builds when checking for one in progress", async () => {
      primeK8sClient({ pipelineRuns: [makeBranchRun("succeeded")] });

      const caller = createCaller(mockContext);
      const result = await caller.pipelineRun.build(buildInput({ branch: BRANCH }));

      expect(result.kind).toBe("created");
    });

    it("passes a create failure through handleK8sError", async () => {
      primeK8sClient();
      k8s.createResource.mockRejectedValueOnce(new K8sApiError(403, "Forbidden", "{}"));

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("dry run", () => {
    it("returns the rendered manifest without listing runs or creating", async () => {
      primeK8sClient();

      const caller = createCaller(mockContext);
      const result = await caller.pipelineRun.build(buildInput({ branch: BRANCH, dryRun: true }));

      expect(result.kind).toBe("dryRun");
      if (result.kind !== "dryRun") throw new Error("expected dryRun");

      const metadata = result.manifest.metadata as { generateName?: string; namespace?: string };
      expect(metadata.generateName).toBe(`build-${CODEBASE_BRANCH_NAME}-`);
      expect(metadata.namespace).toBe(NAMESPACE);

      expect(k8s.createResource).not.toHaveBeenCalled();
      expect(k8s.listResource).not.toHaveBeenCalledWith(
        expect.objectContaining({ kind: "PipelineRun" }),
        expect.anything(),
        expect.anything()
      );
    });

    it("renders even when the branch is not ready and a build is running", async () => {
      primeK8sClient({
        codebaseBranches: [{ ...makeCodebaseBranch(), status: { status: "failed" } }],
        pipelineRuns: [makeBranchRun("running")],
      });

      const caller = createCaller(mockContext);
      const result = await caller.pipelineRun.build(buildInput({ branch: BRANCH, dryRun: true }));

      expect(result.kind).toBe("dryRun");
    });
  });

  describe("input validation", () => {
    it("rejects a managed param override without touching the K8s API", async () => {
      primeK8sClient();

      const caller = createCaller(mockContext);
      await expect(
        caller.pipelineRun.build(buildInput({ branch: BRANCH, params: { "git-source-url": "ssh://evil/repo" } }))
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        cause: { reason: "managed_param_override" },
      });

      expect(k8s.getResource).not.toHaveBeenCalled();
      expect(k8s.listResource).not.toHaveBeenCalled();
      expect(k8s.createResource).not.toHaveBeenCalled();
    });

    it("rejects unknown input fields", async () => {
      const caller = createCaller(mockContext);
      await expect(
        // @ts-expect-error — labels is not an input field
        caller.pipelineRun.build({ namespace: NAMESPACE, codebase: CODEBASE, labels: { app: "x" } })
      ).rejects.toThrow();
    });

    it("rejects a codebase name that is not a Kubernetes name", async () => {
      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ codebase: "My_App" }))).rejects.toThrow();
    });

    it("accepts a branch name containing a slash", async () => {
      primeK8sClient({
        codebaseBranches: [codebaseBranchWith({ spec: { branchName: "feat/new-thing" } })],
      });

      const caller = createCaller(mockContext);
      const result = await caller.pipelineRun.build(buildInput({ branch: "feat/new-thing" }));

      expect(result.kind).toBe("created");
    });
  });

  describe("resolution failures", () => {
    const RESOLUTION_FAILURES: Array<{
      reason: string;
      code: string;
      input?: BuildInputOverrides;
      scenario: () => Scenario;
    }> = [
      { reason: "codebase_not_found", code: "NOT_FOUND", scenario: () => ({ resources: { Codebase: undefined } }) },
      {
        reason: "branch_not_specified",
        code: "BAD_REQUEST",
        input: {},
        scenario: () => ({ resources: { Codebase: codebaseWithSpec({ defaultBranch: "" }) } }),
      },
      { reason: "codebase_branch_not_found", code: "NOT_FOUND", scenario: () => ({ codebaseBranches: [] }) },
      {
        reason: "codebase_branch_ambiguous",
        code: "CONFLICT",
        scenario: () => ({
          codebaseBranches: [makeCodebaseBranch(), codebaseBranchWith({ metadata: { name: "my-app-main-z9y8x" } })],
        }),
      },
      {
        reason: "build_pipeline_not_configured",
        code: "BAD_REQUEST",
        scenario: () => ({ codebaseBranches: [codebaseBranchWith({ spec: { pipelines: {} } })] }),
      },
      { reason: "git_server_not_found", code: "NOT_FOUND", scenario: () => ({ resources: { GitServer: undefined } }) },
      {
        reason: "trigger_template_not_found",
        code: "NOT_FOUND",
        scenario: () => ({ resources: { TriggerTemplate: undefined } }),
      },
      {
        reason: "build_template_misconfigured",
        code: "BAD_REQUEST",
        scenario: () => ({
          resources: { TriggerTemplate: { ...makeTriggerTemplate(), spec: { resourcetemplates: [] } } },
        }),
      },
    ];

    it.each(RESOLUTION_FAILURES)("$reason", async ({ reason, code, input, scenario }) => {
      primeK8sClient(scenario());

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput(input ?? { branch: BRANCH }))).rejects.toMatchObject({
        code,
        cause: { reason },
      });
    });

    it("gitlab_ci_not_supported stops after the Codebase read", async () => {
      primeK8sClient({
        resources: { Codebase: codebaseWithSpec({ ciTool: "gitlab" }) },
      });

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
        code: "BAD_REQUEST",
        cause: { reason: "gitlab_ci_not_supported" },
      });

      expect(k8s.getResource).toHaveBeenCalledTimes(1);
      expect(k8s.listResource).not.toHaveBeenCalled();
      expect(k8s.createResource).not.toHaveBeenCalled();
    });

    it("tolerates a missing build Pipeline", async () => {
      primeK8sClient({ resources: { Pipeline: undefined } });

      const caller = createCaller(mockContext);
      const result = await caller.pipelineRun.build(buildInput({ branch: BRANCH }));

      expect(result.kind).toBe("created");
    });

    it("propagates a build Pipeline read failure that is not a 404", async () => {
      primeK8sClient({ resources: { Pipeline: new K8sApiError(500, "Internal Server Error", "{}") } });

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });

      expect(k8s.createResource).not.toHaveBeenCalled();
    });
  });

  describe("create-path preconditions", () => {
    it("codebase_branch_not_ready when the branch status is not 'created'", async () => {
      primeK8sClient({
        codebaseBranches: [{ ...makeCodebaseBranch(), status: { status: "failed" } }],
      });

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
        code: "CONFLICT",
        cause: { reason: "codebase_branch_not_ready" },
      });

      expect(k8s.createResource).not.toHaveBeenCalled();
    });

    it("build_in_progress when a run for the branch is still going", async () => {
      primeK8sClient({ pipelineRuns: [makeBranchRun("succeeded"), makeBranchRun("running")] });

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
        code: "CONFLICT",
        cause: { reason: "build_in_progress" },
      });

      expect(k8s.createResource).not.toHaveBeenCalled();
    });
  });

  describe("fail-closed lists", () => {
    it("list_truncated when the CodebaseBranch list carries a continue token", async () => {
      primeK8sClient({ branchListContinue: "next-page" });

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        cause: { reason: "list_truncated" },
      });
    });

    it("list_truncated when the build-run list carries a continue token", async () => {
      primeK8sClient({ runListContinue: "next-page" });

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        cause: { reason: "list_truncated" },
      });

      expect(k8s.createResource).not.toHaveBeenCalled();
    });
  });

  describe("error precedence", () => {
    it("reports the missing GitServer, not the build already running", async () => {
      primeK8sClient({ resources: { GitServer: undefined }, pipelineRuns: [makeBranchRun("running")] });

      const caller = createCaller(mockContext);
      await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
        cause: { reason: "git_server_not_found" },
      });
    });
  });

  it("uninitialized K8s client throws before any K8s call", async () => {
    primeK8sClient();
    k8s.KubeConfig = null as unknown as object;

    const caller = createCaller(mockContext);
    await expect(caller.pipelineRun.build(buildInput({ branch: BRANCH }))).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });

    expect(k8s.getResource).not.toHaveBeenCalled();
    expect(k8s.listResource).not.toHaveBeenCalled();
    expect(k8s.createResource).not.toHaveBeenCalled();
  });
});
