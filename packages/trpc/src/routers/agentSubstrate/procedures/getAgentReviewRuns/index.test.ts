import { K8sApiError, k8sCodebaseConfig, type K8sResourceConfig, type MergeRequest } from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import {
  AgentSubstrateSourceError,
  MemoryAgentSubstrateSource,
  type SubstrateActor,
  type SubstrateActorTemplate,
} from "../../../../clients/agentSubstrate/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { MemoryReviewRunSource } from "../../../../clients/reviewRuns/index.js";
import { createCaller } from "../../../index.js";

const ATESPACE = "krci-agents";
const PLATFORM_NAMESPACE = "krci";
const GO_CODEBASE_REF = { name: "test-go-app", namespace: PLATFORM_NAMESPACE };

function actor(name: string): SubstrateActor {
  return {
    atespace: ATESPACE,
    name,
    uid: `uid-${name}`,
    createTime: "2026-11-16T16:35:32.274Z",
    updateTime: "2026-11-16T17:09:19.320Z",
    actorTemplate: { atespace: ATESPACE, name },
    state: "running",
    workerAssignment: null,
    crash: null,
    snapshots: [],
  };
}

function actorTemplate(name: string, env: Record<string, string>): SubstrateActorTemplate {
  return {
    atespace: ATESPACE,
    name,
    uid: `tpl-${name}`,
    containers: [
      {
        name: "claude",
        image: "agent:1",
        env: Object.entries(env).map(([envName, value]) => ({ name: envName, value })),
      },
    ],
    limits: { cpuMillicores: 1000, memoryBytes: 2147483648 },
    workerSelector: {},
    preferredSnapshotFidelity: null,
  };
}

const goEnv = (projectPath: string, iid: string) => ({
  PROJECT_ID: "2",
  PROJECT_PATH: projectPath,
  ISSUE_IID: iid,
  AGENT_PROFILE: "go",
});

function agentSource(): MemoryAgentSubstrateSource {
  return new MemoryAgentSubstrateSource({
    actors: [actor("issue-2-32"), actor("issue-7-3"), actor("debug-shell")],
    actorTemplates: [
      actorTemplate("issue-2-32", goEnv("krci/test-go-app", "32")),
      actorTemplate("issue-7-3", goEnv("krci/no-codebase", "3")),
      actorTemplate("debug-shell", { LOG_LEVEL: "debug" }),
    ],
  });
}

function mergeRequest(number: string, sourceBranch: string, runName: string): MergeRequest {
  return {
    number,
    url: `https://gitlab.example.com/krci/test-go-app/-/merge_requests/${number}`,
    sourceBranch,
    targetBranch: "main",
    title: null,
    state: null,
    draft: null,
    reviewRuns: [
      {
        name: runName,
        namespace: PLATFORM_NAMESPACE,
        status: { phase: "in-progress", reason: "running" },
        startedAt: "2026-11-24T18:10:00Z",
        durationMs: null,
        commit: "4f1c2e9d0b7a",
        origin: "live",
      },
    ],
  };
}

const ISSUE_32_MR = mergeRequest("5", "agent/issue-32", "test-go-app-review-x1");

function reviewRunSource(): MemoryReviewRunSource {
  return new MemoryReviewRunSource([
    { codebase: GO_CODEBASE_REF, mergeRequest: ISSUE_32_MR },
    { codebase: GO_CODEBASE_REF, mergeRequest: mergeRequest("6", "agent/issue-33", "test-go-app-review-y1") },
    {
      codebase: { name: "other-app", namespace: PLATFORM_NAMESPACE },
      mergeRequest: mergeRequest("1", "agent/issue-32", "other-app-review-z1"),
    },
  ]);
}

function stubCodebases(codebases: unknown[] | "forbidden") {
  return vi
    .spyOn(K8sClient.prototype, "listResource")
    .mockImplementation(async (config: K8sResourceConfig, namespace?: string) => {
      if (config !== k8sCodebaseConfig || namespace !== PLATFORM_NAMESPACE || codebases === "forbidden") {
        throw new K8sApiError(403, "Forbidden", "");
      }
      return { items: codebases } as never;
    });
}

const GO_CODEBASE = {
  metadata: { name: "test-go-app", namespace: PLATFORM_NAMESPACE },
  spec: { gitUrlPath: "/krci/test-go-app", gitServer: "gitlab" },
};

const REF = { atespace: ATESPACE, name: "issue-2-32" };

describe("agentSubstrate.getAgentReviewRuns", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
    mockContext.agentSubstrateSource = agentSource();
    mockContext.reviewRunSource = reviewRunSource();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(K8sClient.prototype, "getResource").mockRejectedValue(new K8sApiError(403, "Forbidden", ""));
    vi.stubEnv("DEFAULT_CLUSTER_NAMESPACE", PLATFORM_NAMESPACE);
    stubCodebases([GO_CODEBASE]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("gives the merge requests of the issue branch in the Codebase of the agent", async () => {
    const result = await createCaller(mockContext).agentSubstrate.getAgentReviewRuns(REF);

    expect(result).toEqual({ mergeRequests: [ISSUE_32_MR] });
  });

  it("asks the review run source with the session, the Codebase and the issue branch", async () => {
    const source = reviewRunSource();
    const listMergeRequests = vi.spyOn(source, "listMergeRequests");
    mockContext.reviewRunSource = source;

    await createCaller(mockContext).agentSubstrate.getAgentReviewRuns(REF);

    expect(listMergeRequests).toHaveBeenCalledWith(mockContext.session, {
      codebase: GO_CODEBASE_REF,
      issueBranch: "agent/issue-32",
    });
  });

  it("rejects a caller with no session with UNAUTHORIZED", async () => {
    mockContext.session.user = undefined;

    await expect(createCaller(mockContext).agentSubstrate.getAgentReviewRuns(REF)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it.each([
    ["an empty atespace", { atespace: "", name: "issue-2-32" }],
    ["an extra key", { atespace: ATESPACE, name: "issue-2-32", uid: "x" }],
    ["an uppercase name", { atespace: ATESPACE, name: "Issue-2-32" }],
    ["a name of 64 characters", { atespace: ATESPACE, name: "a".repeat(64) }],
  ])("rejects an input with %s with BAD_REQUEST", async (_case, input) => {
    await expect(
      createCaller(mockContext).agentSubstrate.getAgentReviewRuns(input as typeof REF)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it.each([
    ["an actor that hosts no agent", "debug-shell"],
    ["an actor that does not exist", "issue-9-9"],
    ["an agent with no matching Codebase", "issue-7-3"],
  ])("gives no merge request for %s and does not read review runs", async (_case, name) => {
    const source = reviewRunSource();
    const listMergeRequests = vi.spyOn(source, "listMergeRequests");
    mockContext.reviewRunSource = source;

    const result = await createCaller(mockContext).agentSubstrate.getAgentReviewRuns({ atespace: ATESPACE, name });

    expect(result).toEqual({ mergeRequests: [] });
    expect(listMergeRequests).not.toHaveBeenCalled();
  });

  it("gives no merge request when the user may not list Codebases", async () => {
    stubCodebases("forbidden");

    const result = await createCaller(mockContext).agentSubstrate.getAgentReviewRuns(REF);

    expect(result).toEqual({ mergeRequests: [] });
  });

  it("gives no merge request when Agent Substrate is not configured", async () => {
    mockContext.agentSubstrateSource = undefined;

    const result = await createCaller(mockContext).agentSubstrate.getAgentReviewRuns(REF);

    expect(result).toEqual({ mergeRequests: [] });
  });

  it("gives no merge request when the context holds no review run source", async () => {
    mockContext.reviewRunSource = undefined;

    const result = await createCaller(mockContext).agentSubstrate.getAgentReviewRuns(REF);

    expect(result).toEqual({ mergeRequests: [] });
  });

  it("fails when Agent Substrate is unreachable", async () => {
    const source = agentSource();
    source.failWith(new AgentSubstrateSourceError("unavailable", "connection refused"));
    mockContext.agentSubstrateSource = source;

    await expect(createCaller(mockContext).agentSubstrate.getAgentReviewRuns(REF)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it.each([
    [403, "FORBIDDEN"],
    [401, "FORBIDDEN"],
    [500, "INTERNAL_SERVER_ERROR"],
  ])("fails with the code of a K8s %i of the review run read", async (status, code) => {
    const source = reviewRunSource();
    source.failWith(new K8sApiError(status, "failed", ""));
    mockContext.reviewRunSource = source;

    await expect(createCaller(mockContext).agentSubstrate.getAgentReviewRuns(REF)).rejects.toMatchObject({ code });
  });

  it("gives a new empty result to each caller", async () => {
    mockContext.reviewRunSource = undefined;
    const caller = createCaller(mockContext);

    const first = await caller.agentSubstrate.getAgentReviewRuns(REF);
    first.mergeRequests.push(ISSUE_32_MR);

    expect(await caller.agentSubstrate.getAgentReviewRuns(REF)).toEqual({ mergeRequests: [] });
  });
});
