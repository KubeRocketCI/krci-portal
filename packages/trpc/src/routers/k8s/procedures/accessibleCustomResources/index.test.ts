import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { K8sClient } from "../../../../clients/k8s/index.js";
import type { V1ResourceRule } from "@kubernetes/client-node";

// Mock K8sClient at module level
vi.mock("../../../../clients/k8s/index.js", () => {
  return {
    K8sClient: vi.fn(),
  };
});

const input = { clusterName: "test-cluster", namespace: "edp-delivery" };

const ssrrResponse = (resourceRules: V1ResourceRule[], extra: { evaluationError?: string } = {}) => ({
  status: {
    incomplete: true,
    resourceRules,
    nonResourceRules: [],
    ...extra,
  },
});

const apiGroupList = {
  groups: [
    {
      name: "v2.edp.epam.com",
      preferredVersion: { groupVersion: "v2.edp.epam.com/v1", version: "v1" },
      versions: [{ groupVersion: "v2.edp.epam.com/v1", version: "v1" }],
    },
    {
      name: "v1.edp.epam.com",
      preferredVersion: { groupVersion: "v1.edp.epam.com/v1alpha1", version: "v1alpha1" },
      versions: [{ groupVersion: "v1.edp.epam.com/v1alpha1", version: "v1alpha1" }],
    },
  ],
};

const v2ResourceList = {
  resources: [
    { name: "codebasebranches", singularName: "codebasebranch", namespaced: true, kind: "CodebaseBranch" },
    { name: "codebasebranches/status", singularName: "", namespaced: true, kind: "CodebaseBranch" },
    { name: "stages", singularName: "", namespaced: true, kind: "Stage" },
  ],
};

const v1ResourceList = {
  resources: [
    { name: "clusterkeycloaks", singularName: "clusterkeycloak", namespaced: false, kind: "ClusterKeycloak" },
  ],
};

describe("k8sAccessibleCustomResourcesProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  let mockAuthApi: {
    createSelfSubjectRulesReview: Mock;
  };

  let mockKubeConfig: {
    makeApiClient: Mock;
  };

  let mockFetchApiPath: Mock;

  beforeEach(() => {
    mockContext = createMockedContext();

    mockAuthApi = {
      createSelfSubjectRulesReview: vi.fn(),
    };

    mockKubeConfig = {
      makeApiClient: vi.fn().mockReturnValue(mockAuthApi),
    };

    mockFetchApiPath = vi.fn().mockImplementation((path: string) => {
      if (path === "/apis") return Promise.resolve(apiGroupList);
      if (path === "/apis/v2.edp.epam.com/v1") return Promise.resolve(v2ResourceList);
      if (path === "/apis/v1.edp.epam.com/v1alpha1") return Promise.resolve(v1ResourceList);
      return Promise.reject(new Error(`Unexpected discovery path: ${path}`));
    });

    // Mock K8sClient constructor to return an object with KubeConfig + fetchApiPath
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: mockKubeConfig, fetchApiPath: mockFetchApiPath };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("intersects SSRR rules with discovery and returns the catalog sorted by group then kind", async () => {
    mockAuthApi.createSelfSubjectRulesReview.mockResolvedValue(
      ssrrResponse([
        { apiGroups: ["v2.edp.epam.com"], resources: ["codebasebranches"], verbs: ["*"] },
        { apiGroups: ["v2.edp.epam.com"], resources: ["stages"], verbs: ["get", "list", "watch"] },
        { apiGroups: ["v1.edp.epam.com"], resources: ["clusterkeycloaks"], verbs: ["get", "list", "watch"] },
        // Built-in group rule must be ignored entirely.
        { apiGroups: ["apps"], resources: ["deployments"], verbs: ["*"] },
      ])
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.accessibleCustomResources(input);

    expect(mockAuthApi.createSelfSubjectRulesReview).toHaveBeenCalledWith({
      body: {
        apiVersion: "authorization.k8s.io/v1",
        kind: "SelfSubjectRulesReview",
        spec: { namespace: "edp-delivery" },
      },
    });

    expect(result).toEqual([
      {
        group: "v1.edp.epam.com",
        version: "v1alpha1",
        plural: "clusterkeycloaks",
        kind: "ClusterKeycloak",
        singular: "clusterkeycloak",
        namespaced: false,
        verbs: ["get", "list", "watch"],
        editable: false,
      },
      {
        group: "v2.edp.epam.com",
        version: "v1",
        plural: "codebasebranches",
        kind: "CodebaseBranch",
        singular: "codebasebranch",
        namespaced: true,
        verbs: ["*"],
        editable: true,
      },
      {
        group: "v2.edp.epam.com",
        version: "v1",
        plural: "stages",
        kind: "Stage",
        // Discovery returned an empty singularName — falls back to lowercase kind.
        singular: "stage",
        namespaced: true,
        verbs: ["get", "list", "watch"],
        editable: false,
      },
    ]);
  });

  it("expands a per-group resources wildcard against discovery, merging explicit verbs", async () => {
    mockAuthApi.createSelfSubjectRulesReview.mockResolvedValue(
      ssrrResponse([
        { apiGroups: ["v2.edp.epam.com"], resources: ["*"], verbs: ["get", "list"] },
        { apiGroups: ["v2.edp.epam.com"], resources: ["codebasebranches"], verbs: ["update"] },
      ])
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.accessibleCustomResources(input);

    // Subresource codebasebranches/status must not appear.
    expect(result.map((r) => r.plural)).toEqual(["codebasebranches", "stages"]);
    const codebaseBranches = result.find((r) => r.plural === "codebasebranches")!;
    expect(codebaseBranches.verbs.sort()).toEqual(["get", "list", "update"]);
    expect(codebaseBranches.editable).toBe(true);
    const stages = result.find((r) => r.plural === "stages")!;
    expect(stages.verbs.sort()).toEqual(["get", "list"]);
    expect(stages.editable).toBe(false);
  });

  it("catalogs a plural served only in a non-preferred version, preferring the preferred one otherwise", async () => {
    const multiVersionGroupList = {
      groups: [
        {
          name: "tekton.dev",
          preferredVersion: { groupVersion: "tekton.dev/v1", version: "v1" },
          versions: [
            { groupVersion: "tekton.dev/v1", version: "v1" },
            { groupVersion: "tekton.dev/v1beta1", version: "v1beta1" },
          ],
        },
      ],
    };
    mockFetchApiPath.mockImplementation((path: string) => {
      if (path === "/apis") return Promise.resolve(multiVersionGroupList);
      if (path === "/apis/tekton.dev/v1")
        return Promise.resolve({
          resources: [{ name: "pipelineruns", singularName: "pipelinerun", namespaced: true, kind: "PipelineRun" }],
        });
      if (path === "/apis/tekton.dev/v1beta1")
        return Promise.resolve({
          resources: [
            // Served in both versions — must be cataloged once, at the preferred version.
            { name: "pipelineruns", singularName: "pipelinerun", namespaced: true, kind: "PipelineRun" },
            // Served ONLY at v1beta1 — the RBAC grant is real, so it must still appear.
            { name: "clustertasks", singularName: "clustertask", namespaced: false, kind: "ClusterTask" },
          ],
        });
      return Promise.reject(new Error(`Unexpected discovery path: ${path}`));
    });
    mockAuthApi.createSelfSubjectRulesReview.mockResolvedValue(
      ssrrResponse([{ apiGroups: ["tekton.dev"], resources: ["pipelineruns", "clustertasks"], verbs: ["get", "list"] }])
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.accessibleCustomResources(input);

    expect(result.map((r) => `${r.plural}@${r.version}`)).toEqual(["clustertasks@v1beta1", "pipelineruns@v1"]);
  });

  it("returns an empty catalog instead of failing when /apis responds without a groups field", async () => {
    mockAuthApi.createSelfSubjectRulesReview.mockResolvedValue(
      ssrrResponse([{ apiGroups: ["v2.edp.epam.com"], resources: ["stages"], verbs: ["get", "list"] }])
    );
    mockFetchApiPath.mockImplementation((path: string) => {
      if (path === "/apis") return Promise.resolve({});
      return Promise.reject(new Error(`Unexpected discovery path: ${path}`));
    });

    const caller = createCaller(mockContext);

    await expect(caller.k8s.accessibleCustomResources(input)).resolves.toEqual([]);
  });

  it("drops stale rules: unknown groups and plurals not served in any version of the group", async () => {
    mockAuthApi.createSelfSubjectRulesReview.mockResolvedValue(
      ssrrResponse([
        { apiGroups: ["gone.example.com"], resources: ["ghosts"], verbs: ["*"] },
        { apiGroups: ["v2.edp.epam.com"], resources: ["removedthings"], verbs: ["*"] },
      ])
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.accessibleCustomResources(input);

    expect(result).toEqual([]);
  });

  it("skips a group whose discovery call fails and still returns the rest", async () => {
    mockAuthApi.createSelfSubjectRulesReview.mockResolvedValue(
      ssrrResponse([
        { apiGroups: ["v2.edp.epam.com"], resources: ["stages"], verbs: ["get", "list"] },
        { apiGroups: ["v1.edp.epam.com"], resources: ["clusterkeycloaks"], verbs: ["get"] },
      ])
    );
    mockFetchApiPath.mockImplementation((path: string) => {
      if (path === "/apis") return Promise.resolve(apiGroupList);
      if (path === "/apis/v2.edp.epam.com/v1") return Promise.reject(new Error("boom"));
      if (path === "/apis/v1.edp.epam.com/v1alpha1") return Promise.resolve(v1ResourceList);
      return Promise.reject(new Error(`Unexpected discovery path: ${path}`));
    });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.accessibleCustomResources(input);

    expect(result.map((r) => r.plural)).toEqual(["clusterkeycloaks"]);
  });

  it("returns [] without calling discovery when no catalog-eligible rules exist", async () => {
    mockAuthApi.createSelfSubjectRulesReview.mockResolvedValue(
      ssrrResponse([{ apiGroups: ["apps"], resources: ["deployments"], verbs: ["*"] }])
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.accessibleCustomResources(input);

    expect(result).toEqual([]);
    expect(mockFetchApiPath).not.toHaveBeenCalled();
  });

  it("logs the SSRR evaluationError but still returns the rules-derived catalog", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockAuthApi.createSelfSubjectRulesReview.mockResolvedValue(
      ssrrResponse([{ apiGroups: ["v2.edp.epam.com"], resources: ["stages"], verbs: ["get", "list"] }], {
        evaluationError: "webhook authorizer does not support user rule resolution",
      })
    );

    const caller = createCaller(mockContext);
    const result = await caller.k8s.accessibleCustomResources(input);

    expect(result.map((r) => r.plural)).toEqual(["stages"]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("webhook authorizer does not support"));
    warnSpy.mockRestore();
  });

  it("throws when the SelfSubjectRulesReview call fails", async () => {
    mockAuthApi.createSelfSubjectRulesReview.mockRejectedValueOnce(new Error("Kubernetes API unavailable"));

    const caller = createCaller(mockContext);

    await expect(caller.k8s.accessibleCustomResources(input)).rejects.toThrow("Kubernetes API unavailable");
  });

  it("throws a validation error for missing input fields", async () => {
    const caller = createCaller(mockContext);

    await expect(
      caller.k8s.accessibleCustomResources({ clusterName: "test-cluster" } as unknown as typeof input)
    ).rejects.toThrow();
  });
});
