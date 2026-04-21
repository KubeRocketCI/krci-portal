import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { k8sGetProcedure } from "./index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";

// Mock K8sClient at module level
vi.mock("../../../../../clients/k8s/index.js", () => {
  return {
    K8sClient: vi.fn(),
  };
});

describe("k8sGetProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    getResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock K8sClient instance
    mockK8sClientInstance = {
      KubeConfig: {},
      getResource: vi.fn(),
    };

    // Mock K8sClient constructor
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call getResource with correct parameters", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "test-resource",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
    };

    const mockResponse = {
      apiVersion: "test.group.io/v1",
      kind: "TestResource",
      metadata: { name: "test-resource" },
    };

    mockK8sClientInstance.getResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.get(input);

    expect(mockK8sClientInstance.getResource).toHaveBeenCalledWith(input.resourceConfig, input.name, input.namespace);
    expect(result).toEqual(mockResponse);
  });

  it("should throw validation error for missing required input fields", async () => {
    const invalidInput = {
      clusterName: "test-cluster",
      // resourceConfig missing
      namespace: "test-namespace",
      // name missing
    };

    const caller = createCaller(mockContext);

    await expect(caller.k8s.get(invalidInput as inferProcedureInput<typeof k8sGetProcedure>)).rejects.toThrowError();
  });

  it("should throw error when K8sClient.getResource throws an error", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "test-resource",
      resourceConfig: {
        group: "test.group.io",
        version: "v1",
        pluralName: "testresources",
        kind: "TestResource",
        singularName: "testresource",
        apiVersion: "test.group.io/v1",
      },
    };

    const errorResponse = new Error("Forbidden: User lacks permission");

    mockK8sClientInstance.getResource.mockRejectedValueOnce(errorResponse);

    const caller = createCaller(mockContext);

    await expect(caller.k8s.get(input)).rejects.toThrow("Forbidden: User lacks permission");
  });

  it("forwards labels, annotations and creationTimestamp through the schema", async () => {
    const input = {
      clusterName: "test-cluster",
      namespace: "test-namespace",
      name: "review-my-app-main-abc12",
      resourceConfig: {
        group: "tekton.dev",
        version: "v1",
        pluralName: "pipelineruns",
        kind: "PipelineRun",
        singularName: "pipelinerun",
        apiVersion: "tekton.dev/v1",
      },
    };

    const mockResponse = {
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
          "app.edp.epam.com/git-author": "alice",
          "app.edp.epam.com/git-change-number": "42",
        },
        annotations: {
          "app.edp.epam.com/git-change-url": "https://github.com/org/my-app/pull/42",
          "app.edp.epam.com/git-commit-sha": "deadbeefcafef00d",
        },
      },
    };

    mockK8sClientInstance.getResource.mockResolvedValueOnce(mockResponse);

    const caller = createCaller(mockContext);
    const result = await caller.k8s.get(input);

    const meta = result.metadata as Record<string, unknown>;
    expect(meta.creationTimestamp).toBe("2024-01-01T10:00:00Z");
    expect(meta.labels).toEqual(mockResponse.metadata.labels);
    expect(meta.annotations).toEqual(mockResponse.metadata.annotations);
  });
});
