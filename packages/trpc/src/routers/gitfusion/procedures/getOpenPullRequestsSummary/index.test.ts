import { afterEach, describe, expect, it, vi } from "vitest";
import { k8sCodebaseConfig, k8sGitServerConfig } from "@my-project/shared";
import { createMockedContext } from "../../../../__mocks__/context.js";

const mockListResource = vi.fn();
const mockGetPullRequests = vi.fn();

vi.mock("../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(function () {
    return {
      KubeConfig: {},
      listResource: mockListResource,
    };
  }),
}));

vi.mock("../../../../clients/gitfusion/index.js", () => ({
  createGitFusionClient: () => ({
    getPullRequests: mockGetPullRequests,
  }),
}));

async function getCaller() {
  const { createCaller } = await import("../../../../routers/index.js");
  return createCaller(createMockedContext());
}

const input = { clusterName: "in-cluster", namespace: "test-namespace" };

function codebase(name: string, gitServer: string) {
  return { metadata: { name }, spec: { gitServer, gitUrlPath: `/team/${name}` } };
}

function gitServer(name: string, provider: string) {
  return { metadata: { name }, spec: { gitProvider: provider } };
}

function stubK8s({ gitServers }: { gitServers: unknown[] | Error }) {
  mockListResource.mockImplementation(async (config: unknown) => {
    if (config === k8sCodebaseConfig) {
      return { items: [codebase("app-github", "github"), codebase("app-gerrit", "gerrit")] };
    }
    if (config === k8sGitServerConfig) {
      if (gitServers instanceof Error) throw gitServers;
      return { items: gitServers };
    }
    throw new Error("unexpected resource");
  });
}

const prResponse = {
  data: [{ id: "1", number: 1, title: "PR 1", url: "https://example.com/1", updated_at: "2026-01-01T00:00:00Z" }],
  pagination: { total: 1 },
};

describe("gitfusion.getOpenPullRequestsSummary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not request pull requests for Gerrit codebases", async () => {
    stubK8s({ gitServers: [gitServer("github", "github"), gitServer("gerrit", "gerrit")] });
    mockGetPullRequests.mockResolvedValue(prResponse);

    const caller = await getCaller();
    const result = await caller.gitfusion.getOpenPullRequestsSummary(input);

    expect(mockGetPullRequests).toHaveBeenCalledTimes(1);
    expect(mockGetPullRequests).toHaveBeenCalledWith("github", "team", "app-github", "open", 1, 3);
    expect(result.repos.map((repo) => repo.codebaseName)).toEqual(["app-github"]);
    expect(result.totalOpen).toBe(1);
  });

  it("requests every codebase when the GitServer list fails", async () => {
    stubK8s({ gitServers: new Error("forbidden") });
    mockGetPullRequests.mockResolvedValue(prResponse);

    const caller = await getCaller();
    await caller.gitfusion.getOpenPullRequestsSummary(input);

    expect(mockGetPullRequests).toHaveBeenCalledTimes(2);
  });
});
