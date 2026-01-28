import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { ConfigMap, Secret, ServiceAccount, containerRegistryType } from "@my-project/shared";

// Mock K8sClient
vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

// Mock the edit functions from shared
vi.mock("@my-project/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@my-project/shared")>();
  return {
    ...actual,
    editKRCIConfigMapRegistryData: vi.fn(
      (
        configMap: ConfigMap,
        input: { registryType: string; registrySpace: string; registryEndpoint?: string; awsRegion?: string }
      ) => ({
        ...configMap,
        data: {
          ...configMap.data,
          "container-registry-type": input.registryType,
          "container-registry-space": input.registrySpace,
          ...(input.registryEndpoint && { "container-registry-host": input.registryEndpoint }),
          ...(input.awsRegion && { "aws-region": input.awsRegion }),
        },
      })
    ),
    editPullAccountRegistrySecret: vi.fn(
      (secret: Secret, input: { registryType: string; registryEndpoint: string; user: string; password: string }) => ({
        ...secret,
        data: {
          username: btoa(input.user),
          password: btoa(input.password),
        },
      })
    ),
    editPushAccountRegistrySecret: vi.fn(
      (secret: Secret, input: { registryType: string; registryEndpoint: string; user: string; password: string }) => ({
        ...secret,
        data: {
          username: btoa(input.user),
          password: btoa(input.password),
        },
      })
    ),
    editRegistryServiceAccount: vi.fn((serviceAccount: ServiceAccount, input: { irsaRoleArn: string }) => ({
      ...serviceAccount,
      metadata: {
        ...serviceAccount.metadata,
        annotations: {
          ...serviceAccount.metadata.annotations,
          "eks.amazonaws.com/role-arn": input.irsaRoleArn,
        },
      },
    })),
    createPullAccountRegistrySecretDraft: vi.fn((input: any) => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "regcred",
        namespace: "test-namespace",
      },
      type: "kubernetes.io/dockerconfigjson",
      data: {
        ".dockerconfigjson": btoa(
          JSON.stringify({
            auths: {
              [input.registryEndpoint || "docker.io"]: {
                username: input.user,
                password: input.password,
              },
            },
          })
        ),
      },
    })),
    createPushAccountRegistrySecretDraft: vi.fn((input: any) => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "kaniko-docker-config",
        namespace: "test-namespace",
      },
      type: "kubernetes.io/dockerconfigjson",
      data: {
        ".dockerconfigjson": btoa(
          JSON.stringify({
            auths: {
              [input.registryEndpoint || "docker.io"]: {
                username: input.user,
                password: input.password,
              },
            },
          })
        ),
      },
    })),
  };
});

describe("k8sManageRegistryIntegrationProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    createResource: Mock;
    replaceResource: Mock;
  };

  const mockConfigMap: ConfigMap = {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: {
      name: "edp-config",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
    },
    data: {
      "container-registry-type": containerRegistryType.harbor,
      "container-registry-space": "test-space",
      "container-registry-host": "harbor.example.com",
      platform: "kubernetes",
    },
  };

  const mockPullAccountSecret: Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: "regcred",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
    },
    type: "kubernetes.io/dockerconfigjson",
    data: {
      ".dockerconfigjson": btoa(
        JSON.stringify({
          auths: {
            "harbor.example.com": {
              username: "pull-user",
              password: "pull-password",
            },
          },
        })
      ),
    },
  };

  const mockPushAccountSecret: Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: "kaniko-docker-config",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
    },
    type: "kubernetes.io/dockerconfigjson",
    data: {
      ".dockerconfigjson": btoa(
        JSON.stringify({
          auths: {
            "harbor.example.com": {
              username: "push-user",
              password: "push-password",
            },
          },
        })
      ),
    },
  };

  const mockServiceAccount: ServiceAccount = {
    apiVersion: "v1",
    kind: "ServiceAccount",
    metadata: {
      name: "tekton",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
      annotations: {
        "eks.amazonaws.com/role-arn": "arn:aws:iam::123456789012:role/test-role",
      },
    },
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    mockK8sClientInstance = {
      KubeConfig: {},
      createResource: vi.fn(),
      replaceResource: vi.fn(),
    };

    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("create mode - Harbor registry", () => {
    it("should create pull and push account secrets in create mode", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "create" as const,
        dirtyFields: {
          configMap: false,
          pullAccountSecret: true,
          pushAccountSecret: true,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "test-space",
          registryEndpoint: "harbor.example.com",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "pull-user",
          password: "pull-password",
        },
        pushAccountSecret: {
          user: "push-user",
          password: "push-password",
        },
      };

      const createdPullSecret = { ...mockPullAccountSecret };
      const createdPushSecret = { ...mockPushAccountSecret };
      mockK8sClientInstance.createResource
        .mockResolvedValueOnce(createdPullSecret)
        .mockResolvedValueOnce(createdPushSecret);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageRegistryIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.pullAccountSecret).toEqual(createdPullSecret);
      expect(result.data.pushAccountSecret).toEqual(createdPushSecret);
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledTimes(2);
    });
  });

  describe("edit mode - Harbor registry", () => {
    it("should update ConfigMap when configMap is dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: true,
          pullAccountSecret: false,
          pushAccountSecret: false,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "updated-space",
          registryEndpoint: "harbor.example.com",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "pull-user",
          password: "pull-password",
          currentResource: mockPullAccountSecret,
        },
      };

      const updatedConfigMap = {
        ...mockConfigMap,
        data: {
          ...mockConfigMap.data,
          "container-registry-space": "updated-space",
        },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedConfigMap);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageRegistryIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.configMap).toEqual(updatedConfigMap);
      expect(result.data.pullAccountSecret).toBeUndefined();
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("should update both secrets when both are dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: false,
          pullAccountSecret: true,
          pushAccountSecret: true,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "test-space",
          registryEndpoint: "harbor.example.com",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "updated-pull-user",
          password: "updated-pull-password",
          currentResource: mockPullAccountSecret,
        },
        pushAccountSecret: {
          user: "updated-push-user",
          password: "updated-push-password",
          currentResource: mockPushAccountSecret,
        },
      };

      const updatedPullSecret = { ...mockPullAccountSecret };
      const updatedPushSecret = { ...mockPushAccountSecret };
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedPullSecret)
        .mockResolvedValueOnce(updatedPushSecret);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageRegistryIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.pullAccountSecret).toEqual(updatedPullSecret);
      expect(result.data.pushAccountSecret).toEqual(updatedPushSecret);
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(2);
    });

    it("should update all resources when all are dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: true,
          pullAccountSecret: true,
          pushAccountSecret: true,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "updated-space",
          registryEndpoint: "harbor-new.example.com",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "updated-pull-user",
          password: "updated-pull-password",
          currentResource: mockPullAccountSecret,
        },
        pushAccountSecret: {
          user: "updated-push-user",
          password: "updated-push-password",
          currentResource: mockPushAccountSecret,
        },
      };

      const updatedConfigMap = { ...mockConfigMap };
      const updatedPullSecret = { ...mockPullAccountSecret };
      const updatedPushSecret = { ...mockPushAccountSecret };
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedConfigMap)
        .mockResolvedValueOnce(updatedPullSecret)
        .mockResolvedValueOnce(updatedPushSecret);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageRegistryIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.configMap).toEqual(updatedConfigMap);
      expect(result.data.pullAccountSecret).toEqual(updatedPullSecret);
      expect(result.data.pushAccountSecret).toEqual(updatedPushSecret);
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(3);
    });
  });

  describe("ECR registry with ServiceAccount", () => {
    it("should update ServiceAccount when serviceAccount is dirty", async () => {
      const ecrConfigMap = {
        ...mockConfigMap,
        data: {
          ...mockConfigMap.data,
          "container-registry-type": containerRegistryType.ecr,
          "aws-region": "us-east-1",
        },
      };

      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: false,
          pullAccountSecret: false,
          pushAccountSecret: false,
          serviceAccount: true,
        },
        configMap: {
          registryType: containerRegistryType.ecr,
          registrySpace: "test-space",
          awsRegion: "us-east-1",
          currentResource: ecrConfigMap,
        },
        pullAccountSecret: {
          user: "AWS",
          password: "",
          currentResource: mockPullAccountSecret,
        },
        serviceAccount: {
          irsaRoleArn: "arn:aws:iam::123456789012:role/updated-role",
          currentResource: mockServiceAccount,
        },
      };

      const updatedServiceAccount = {
        ...mockServiceAccount,
        metadata: {
          ...mockServiceAccount.metadata,
          annotations: {
            "eks.amazonaws.com/role-arn": "arn:aws:iam::123456789012:role/updated-role",
          },
        },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedServiceAccount);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageRegistryIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.serviceAccount).toEqual(updatedServiceAccount);
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });
  });

  describe("validation", () => {
    it("should require currentResource for configMap in edit mode", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: true,
          pullAccountSecret: false,
          pushAccountSecret: false,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "test-space",
          // currentResource missing
        },
        pullAccountSecret: {
          user: "pull-user",
          password: "pull-password",
          currentResource: mockPullAccountSecret,
        },
      };

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageRegistryIntegration(input as any)).rejects.toThrow(
        "currentResource is required for configMap in edit mode"
      );
    });

    it("should require currentResource for pullAccountSecret in edit mode", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: false,
          pullAccountSecret: true,
          pushAccountSecret: false,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "test-space",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "pull-user",
          password: "pull-password",
          // currentResource missing
        },
      };

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageRegistryIntegration(input as any)).rejects.toThrow(
        "currentResource is required for pullAccountSecret in edit mode"
      );
    });

    it("should require currentResource for serviceAccount when dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: false,
          pullAccountSecret: false,
          pushAccountSecret: false,
          serviceAccount: true,
        },
        configMap: {
          registryType: containerRegistryType.ecr,
          registrySpace: "test-space",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "AWS",
          password: "",
          currentResource: mockPullAccountSecret,
        },
        serviceAccount: {
          irsaRoleArn: "arn:aws:iam::123456789012:role/test-role",
          // currentResource missing
        },
      };

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageRegistryIntegration(input as any)).rejects.toThrow(
        "currentResource is required for serviceAccount in edit mode"
      );
    });
  });

  describe("fail-fast behavior", () => {
    it("should stop execution if ConfigMap update fails", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: true,
          pullAccountSecret: true,
          pushAccountSecret: false,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "test-space",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "pull-user",
          password: "pull-password",
          currentResource: mockPullAccountSecret,
        },
      };

      mockK8sClientInstance.replaceResource.mockRejectedValueOnce(new Error("Failed to update ConfigMap"));

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageRegistryIntegration(input)).rejects.toThrow("Failed to update ConfigMap");
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("should leave first operations completed if later operation fails", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: true,
          pullAccountSecret: true,
          pushAccountSecret: true,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "test-space",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "pull-user",
          password: "pull-password",
          currentResource: mockPullAccountSecret,
        },
        pushAccountSecret: {
          user: "push-user",
          password: "push-password",
          currentResource: mockPushAccountSecret,
        },
      };

      const updatedConfigMap = { ...mockConfigMap };
      const updatedPullSecret = { ...mockPullAccountSecret };

      // ConfigMap succeeds, PullSecret succeeds, PushSecret fails
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedConfigMap)
        .mockResolvedValueOnce(updatedPullSecret)
        .mockRejectedValueOnce(new Error("Failed to update PushAccount secret"));

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageRegistryIntegration(input)).rejects.toThrow("Failed to update PushAccount secret");

      // Verify 3 calls: ConfigMap (succeeded), PullSecret (succeeded), PushSecret (failed)
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(3);
    });
  });

  describe("no-op scenarios", () => {
    it("should not update anything when no fields are dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          configMap: false,
          pullAccountSecret: false,
          pushAccountSecret: false,
          serviceAccount: false,
        },
        configMap: {
          registryType: containerRegistryType.harbor,
          registrySpace: "test-space",
          currentResource: mockConfigMap,
        },
        pullAccountSecret: {
          user: "pull-user",
          password: "pull-password",
          currentResource: mockPullAccountSecret,
        },
      };

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageRegistryIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.configMap).toBeUndefined();
      expect(result.data.pullAccountSecret).toBeUndefined();
      expect(result.data.pushAccountSecret).toBeUndefined();
      expect(result.data.serviceAccount).toBeUndefined();
      expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
      expect(mockK8sClientInstance.replaceResource).not.toHaveBeenCalled();
    });
  });
});
