import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { k8sListProcedure } from "./index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";

// Mock K8sClient at module level
vi.mock("../../../../../clients/k8s/index.js", () => {
  return {
    K8sClient: vi.fn(),
  };
});

describe("k8sListProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    listResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock K8sClient instance
    mockK8sClientInstance = {
      KubeConfig: {},
      listResource: vi.fn(),
    };

    // Mock K8sClient constructor
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call listResource with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
      labels: {},
    };

    const mockResponse = {
      apiVersion: "test.group.io/v1",
      kind: "TestResourceList",
      metadata: { resourceVersion: "1234" },
      items: [
        {
          metadata: { name: "test-resource" },
        },
      ],
    };

    mockK8sClientInstance.listResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.list(input);

    expect(mockK8sClientInstance.listResource).toHaveBeenCalledWith(input.resourceConfig, input.namespace, "");
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const invalidInput = {
      clusterName: "test-cluster",
      // resourceConfig missing
      namespace: "test-namespace",
    };

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(invalidInput as inferProcedureInput<typeof k8sListProcedure>)).rejects.toThrowError();
  });

  it("should throw error when K8sClient.listResource throws an error", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
      labels: {},
    };

    const errorResponse = new Error("Forbidden: User lacks permission");

    mockK8sClientInstance.listResource.mockRejectedValueOnce(errorResponse);

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(input)).rejects.toThrow("Forbidden: User lacks permission");
  });

  it("should handle K8sClient network errors", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
      labels: {},
    };

    mockK8sClientInstance.listResource.mockRejectedValueOnce(
      new Error("Network error: Failed to connect to Kubernetes API")
    );

    const caller = createCaller(mockContext);

    await expect(caller.k8s.list(input)).rejects.toThrow("Network error: Failed to connect to Kubernetes API");
  });

  it("forwards labels, annotations and creationTimestamp through the schema", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      resourceConfig: {
        group: "tekton.dev",
        version: "v1",
        pluralName: "pipelineruns",
        kind: "PipelineRun",
        singularName: "pipelinerun",
        apiVersion: "tekton.dev/v1",
      },
      labels: {},
    };

    const mockResponse = {
      apiVersion: "tekton.dev/v1",
      kind: "PipelineRunList",
      metadata: { resourceVersion: "1" },
      items: [
        {
          apiVersion: "tekton.dev/v1",
          kind: "PipelineRun",
          metadata: {
            name: "review-my-app-main-abc12",
            namespace: "edp-delivery",
            resourceVersion: "100",
            creationTimestamp: "2024-01-01T10:00:00Z",
            labels: {
              "app.edp.epam.com/codebase": "my-app",
              "app.edp.epam.com/pipelinetype": "review",
              "app.edp.epam.com/git-branch": "feature-x",
              "app.edp.epam.com/git-author": "alice",
              "app.edp.epam.com/git-change-number": "42",
            },
            annotations: {
              "app.edp.epam.com/git-change-url": "https://github.com/org/my-app/pull/42",
              "app.edp.epam.com/git-commit-sha": "deadbeefcafef00d",
            },
          },
        },
      ],
    };

    mockK8sClientInstance.listResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.list(input);

    const meta = result.items[0].metadata as Record<string, unknown>;
    expect(meta.creationTimestamp).toBe("2024-01-01T10:00:00Z");
    expect(meta.labels).toEqual(mockResponse.items[0].metadata.labels);
    expect(meta.annotations).toEqual(mockResponse.items[0].metadata.annotations);
  });
});
