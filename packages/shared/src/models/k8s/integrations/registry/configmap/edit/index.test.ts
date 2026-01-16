import { describe, it, expect } from "vitest";
import { editKRCIConfigMapRegistryData } from "./index.js";
import { ZodError } from "zod";
import { containerRegistryType } from "../../constants.js";
import { ConfigMap } from "../../../../groups/Core/index.js";
import { KubeMetadata } from "../../../../common/types.js";

describe("editKRCIConfigMapRegistryData", () => {
  const createExistingConfigMap = (): ConfigMap => ({
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: {
      name: "krci-config",
      namespace: "default",
      resourceVersion: "12345",
    } as unknown as KubeMetadata,
    data: {
      container_registry_type: containerRegistryType.harbor,
      container_registry_space: "old-space",
      container_registry_host: "harbor.old.com",
    },
  });

  describe("ECR registry", () => {
    it("should update ConfigMap for ECR registry", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.ecr,
        registrySpace: "my-ecr-space",
        awsRegion: "us-east-1",
        registryEndpoint: "123456789.dkr.ecr.us-east-1.amazonaws.com",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_type).toBe(containerRegistryType.ecr);
      expect(result.data?.container_registry_space).toBe("my-ecr-space");
      expect(result.data?.container_registry_host).toBe("123456789.dkr.ecr.us-east-1.amazonaws.com");
      expect(result.data?.aws_region).toBe("us-east-1");
    });

    it("should throw ZodError when awsRegion is missing for ECR", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.ecr,
        registrySpace: "my-ecr-space",
        registryEndpoint: "123456789.dkr.ecr.us-east-1.amazonaws.com",
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });

    it("should throw ZodError when registryEndpoint is missing for ECR", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.ecr,
        registrySpace: "my-ecr-space",
        awsRegion: "us-east-1",
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });

    it("should handle different AWS regions", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.ecr,
        registrySpace: "my-ecr-space",
        awsRegion: "eu-west-1",
        registryEndpoint: "123456789.dkr.ecr.eu-west-1.amazonaws.com",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.aws_region).toBe("eu-west-1");
      expect(result.data?.container_registry_host).toBe("123456789.dkr.ecr.eu-west-1.amazonaws.com");
    });
  });

  describe("GHCR registry", () => {
    it("should update ConfigMap for GHCR registry", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.ghcr,
        registrySpace: "my-org",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_type).toBe(containerRegistryType.ghcr);
      expect(result.data?.container_registry_space).toBe("my-org");
      expect(result.data?.container_registry_host).toBe("ghcr.io");
    });

    it("should set ghcr.io as host regardless of input", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.ghcr,
        registrySpace: "another-org",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_host).toBe("ghcr.io");
    });

    it("should throw ZodError when registrySpace is missing for GHCR", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.ghcr,
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });
  });

  describe("Docker Hub registry", () => {
    it("should update ConfigMap for Docker Hub registry", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.dockerhub,
        registrySpace: "myusername",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_type).toBe(containerRegistryType.dockerhub);
      expect(result.data?.container_registry_space).toBe("myusername");
      expect(result.data?.container_registry_host).toBe("docker.io");
    });

    it("should set docker.io as host regardless of input", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.dockerhub,
        registrySpace: "organization",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_host).toBe("docker.io");
    });

    it("should throw ZodError when registrySpace is missing for Docker Hub", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.dockerhub,
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });
  });

  describe("Harbor registry", () => {
    it("should update ConfigMap for Harbor registry", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.harbor,
        registrySpace: "my-harbor-project",
        registryEndpoint: "harbor.example.com",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_type).toBe(containerRegistryType.harbor);
      expect(result.data?.container_registry_space).toBe("my-harbor-project");
      expect(result.data?.container_registry_host).toBe("harbor.example.com");
    });

    it("should throw ZodError when registryEndpoint is missing for Harbor", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.harbor,
        registrySpace: "my-harbor-project",
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });

    it("should handle Harbor with port in endpoint", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.harbor,
        registrySpace: "project",
        registryEndpoint: "harbor.example.com:8443",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_host).toBe("harbor.example.com:8443");
    });
  });

  describe("OpenShift registry", () => {
    it("should update ConfigMap for OpenShift registry", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.openshift,
        registrySpace: "my-openshift-namespace",
        registryEndpoint: "image-registry.openshift-image-registry.svc:5000",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_type).toBe(containerRegistryType.openshift);
      expect(result.data?.container_registry_space).toBe("my-openshift-namespace");
      expect(result.data?.container_registry_host).toBe("image-registry.openshift-image-registry.svc:5000");
    });

    it("should throw ZodError when registryEndpoint is missing for OpenShift", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.openshift,
        registrySpace: "my-openshift-namespace",
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });
  });

  describe("Nexus registry", () => {
    it("should update ConfigMap for Nexus registry", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.nexus,
        registrySpace: "my-nexus-repo",
        registryEndpoint: "nexus.example.com",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_type).toBe(containerRegistryType.nexus);
      expect(result.data?.container_registry_space).toBe("my-nexus-repo");
      expect(result.data?.container_registry_host).toBe("nexus.example.com");
    });

    it("should throw ZodError when registryEndpoint is missing for Nexus", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.nexus,
        registrySpace: "my-nexus-repo",
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });

    it("should handle Nexus with port in endpoint", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.nexus,
        registrySpace: "repo",
        registryEndpoint: "nexus.example.com:8082",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_host).toBe("nexus.example.com:8082");
    });
  });

  describe("validation", () => {
    it("should throw ZodError when registryType is missing", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registrySpace: "space",
        registryEndpoint: "endpoint",
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });

    it("should throw ZodError for invalid registryType", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: "invalid-type",
        registrySpace: "space",
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });

    it("should throw ZodError when registrySpace is not a string", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.dockerhub,
        registrySpace: 123,
      } as any;

      expect(() => editKRCIConfigMapRegistryData(existingConfigMap, input)).toThrow(ZodError);
    });

    it("should create data object if it doesn't exist", () => {
      const existingConfigMap: ConfigMap = {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: "krci-config",
        } as unknown as KubeMetadata,
      };

      const input = {
        registryType: containerRegistryType.dockerhub,
        registrySpace: "my-space",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data).toBeDefined();
      expect(result.data?.container_registry_type).toBe(containerRegistryType.dockerhub);
      expect(result.data?.container_registry_space).toBe("my-space");
    });
  });

  describe("immutability", () => {
    it("should not modify the original ConfigMap object", () => {
      const existingConfigMap = createExistingConfigMap();
      const originalData = existingConfigMap.data;

      const input = {
        registryType: containerRegistryType.harbor,
        registrySpace: "modified-space",
        registryEndpoint: "harbor.modified.com",
      };

      editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(existingConfigMap.data).toBe(originalData);
      expect(existingConfigMap.data?.container_registry_type).toBe(containerRegistryType.harbor);
      expect(existingConfigMap.data?.container_registry_space).toBe("old-space");
      expect(existingConfigMap.data?.container_registry_host).toBe("harbor.old.com");
    });
  });

  describe("metadata preservation", () => {
    it("should preserve all metadata fields", () => {
      const existingConfigMap: ConfigMap = {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: "krci-config",
          namespace: "production",
          labels: {
            app: "krci",
            "custom-label": "custom-value",
          },
          annotations: {
            "annotation-1": "value-1",
          },
          resourceVersion: "54321",
          uid: "test-uid-789",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
        data: {
          container_registry_type: containerRegistryType.harbor,
          container_registry_space: "old-space",
          container_registry_host: "harbor.old.com",
        },
      };

      const input = {
        registryType: containerRegistryType.ghcr,
        registrySpace: "new-space",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.metadata).toEqual(existingConfigMap.metadata);
      expect(result.metadata.resourceVersion).toBe("54321");
      expect(result.metadata.uid).toBe("test-uid-789");
    });
  });

  describe("special characters", () => {
    it("should handle special characters in registrySpace", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.harbor,
        registrySpace: "space-with-special_chars.123",
        registryEndpoint: "harbor.example.com",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_space).toBe("space-with-special_chars.123");
    });

    it("should handle unicode characters in registrySpace", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.harbor,
        registrySpace: "space-日本語",
        registryEndpoint: "harbor.example.com",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_space).toBe("space-日本語");
    });

    it("should handle very long registrySpace", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.harbor,
        registrySpace: "a".repeat(500),
        registryEndpoint: "harbor.example.com",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_space).toBe("a".repeat(500));
    });

    it("should handle empty string for registrySpace", () => {
      const existingConfigMap = createExistingConfigMap();

      const input = {
        registryType: containerRegistryType.dockerhub,
        registrySpace: "",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_space).toBe("");
    });
  });

  describe("existing data preservation", () => {
    it("should preserve other data fields not related to registry", () => {
      const existingConfigMap: ConfigMap = {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: "krci-config",
        } as unknown as KubeMetadata,
        data: {
          container_registry_type: containerRegistryType.harbor,
          container_registry_space: "old-space",
          container_registry_host: "harbor.old.com",
          custom_field_1: "value1",
          custom_field_2: "value2",
        },
      };

      const input = {
        registryType: containerRegistryType.dockerhub,
        registrySpace: "new-space",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.custom_field_1).toBe("value1");
      expect(result.data?.custom_field_2).toBe("value2");
    });

    it("should retain aws_region when switching from ECR to non-ECR registry", () => {
      const existingConfigMap: ConfigMap = {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: "krci-config",
        } as unknown as KubeMetadata,
        data: {
          container_registry_type: containerRegistryType.ecr,
          container_registry_space: "ecr-space",
          container_registry_host: "123456789.dkr.ecr.us-east-1.amazonaws.com",
          aws_region: "us-east-1",
        },
      };

      const input = {
        registryType: containerRegistryType.dockerhub,
        registrySpace: "dockerhub-space",
      };

      const result = editKRCIConfigMapRegistryData(existingConfigMap, input);

      expect(result.data?.container_registry_type).toBe(containerRegistryType.dockerhub);
      expect(result.data?.aws_region).toBe("us-east-1");
    });
  });
});
