import { createMockedContext } from "../../../../__mocks__/context";
import { createCaller } from "../../../../routers";
import { defaultPermissionsToCheck } from "@my-project/shared";
import { inferProcedureInput } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { k8sGetResourcePermissions } from ".";

describe("k8sGetResourcePermissions", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  let mockAuthApi: {
    createSelfSubjectAccessReview: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    // Create mock AuthApi instance
    mockAuthApi = {
      createSelfSubjectAccessReview: vi.fn(),
    };

    // Configure makeApiClient to return the mock AuthApi
    mockContext.K8sClient.KubeConfig.makeApiClient.mockReturnValue(mockAuthApi);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call createSelfSubjectAccessReview for each verb and return correct result", async () => {
    const input = {
      clusterName: "test-cluster",
      apiVersion: "v1",
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
    };

    const mockResponses = defaultPermissionsToCheck.map((verb) => ({
      status: {
        allowed: true,
        reason: `Allowed to ${verb} testresources`,
      },
    }));

    mockAuthApi.createSelfSubjectAccessReview.mockImplementation(({ body }) => {
      const verb = body.spec.resourceAttributes.verb;
      const index = defaultPermissionsToCheck.indexOf(verb);
      return Promise.resolve(mockResponses[index]);
    });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.itemPermissions(input);

    expect(mockAuthApi.createSelfSubjectAccessReview).toHaveBeenCalledTimes(defaultPermissionsToCheck.length);

    defaultPermissionsToCheck.forEach((verb) => {
      expect(result[verb]).toEqual({
        allowed: true,
        reason: `Allowed to ${verb} testresources`,
      });
    });
  });

  it("should throw validation error for missing input fields", async () => {
    const invalidInput = {
      clusterName: "test-cluster",
      // apiVersion missing
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
    };

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.itemPermissions(invalidInput as inferProcedureInput<typeof k8sGetResourcePermissions>)
    ).rejects.toThrowError();
  });

  it("should return default reason if status.reason is missing", async () => {
    const input = {
      clusterName: "test-cluster",
      apiVersion: "v1",
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
    };

    const mockResponses = defaultPermissionsToCheck.map(() => ({
      status: {
        allowed: false,
        reason: undefined,
      },
    }));

    mockAuthApi.createSelfSubjectAccessReview.mockImplementation(({ body }) => {
      const verb = body.spec.resourceAttributes.verb;
      const index = defaultPermissionsToCheck.indexOf(verb);
      return Promise.resolve(mockResponses[index]);
    });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.itemPermissions(input);

    defaultPermissionsToCheck.forEach((verb) => {
      expect(result[verb]).toEqual({
        allowed: false,
        reason: `You cannot ${verb} testresources`,
      });
    });
  });

  it("should throw error if Kubernetes API call fails", async () => {
    const input = {
      clusterName: "test-cluster",
      apiVersion: "v1",
      group: "test.group.io",
      version: "v1",
      namespace: "test-namespace",
      resourcePlural: "testresources",
    };

    mockAuthApi.createSelfSubjectAccessReview.mockRejectedValueOnce(new Error("Kubernetes API unavailable"));

    const caller = createCaller(mockContext);

    await expect(caller.k8s.itemPermissions(input)).rejects.toThrow("Kubernetes API unavailable");
  });
});
