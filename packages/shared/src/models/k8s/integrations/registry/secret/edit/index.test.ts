import { describe, it, expect } from "vitest";
import { editPullAccountRegistrySecret, editPushAccountRegistrySecret } from "./index.js";
import { ZodError } from "zod";
import {
  containerRegistryType,
  registrySecretName,
  DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT,
  GHCR_DEFAULT_REGISTRY_ENDPOINT,
} from "../../constants.js";
import { SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../../constants.js";
import { Secret } from "../../../../groups/Core/index.js";
import { KubeMetadata } from "../../../../common/types.js";

describe("editPullAccountRegistrySecret", () => {
  const createExistingPullSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: registrySecretName.regcred,
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "registry",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
      resourceVersion: "12345",
    } as unknown as KubeMetadata,
    type: "kubernetes.io/dockerconfigjson",
    data: {
      ".dockerconfigjson": Buffer.from(
        JSON.stringify({
          auths: {
            "harbor.example.com": {
              username: "old-user",
              password: "old-pass",
              auth: Buffer.from("old-user:old-pass", "utf-8").toString("base64"),
            },
          },
        }),
        "utf-8"
      ).toString("base64"),
    },
  });

  it("should update pull account secret for Docker Hub", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryType: containerRegistryType.dockerhub,
      registryEndpoint: "https://index.docker.io/v1/",
      user: "dockeruser",
      password: "dockerpass",
    };

    const result = editPullAccountRegistrySecret(existingSecret, input);

    expect(result.data?.[".dockerconfigjson"]).toBeDefined();
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT]).toBeDefined();
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT].username).toBe("dockeruser");
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT].password).toBe("dockerpass");
  });

  it("should update pull account secret for GHCR", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryType: containerRegistryType.ghcr,
      registryEndpoint: "ghcr.io",
      user: "ghcruser",
      password: "ghcrtoken",
    };

    const result = editPullAccountRegistrySecret(existingSecret, input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths[GHCR_DEFAULT_REGISTRY_ENDPOINT]).toBeDefined();
    expect(config.auths[GHCR_DEFAULT_REGISTRY_ENDPOINT].username).toBe("ghcruser");
  });

  it("should update pull account secret for Harbor", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.newexample.com",
      user: "newharboruser",
      password: "newharborpass",
    };

    const result = editPullAccountRegistrySecret(existingSecret, input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths["harbor.newexample.com"]).toBeDefined();
    expect(config.auths["harbor.newexample.com"].username).toBe("newharboruser");
    expect(config.auths["harbor.newexample.com"].password).toBe("newharborpass");
  });

  it("should throw ZodError when registryType is missing", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryEndpoint: "example.com",
      user: "user",
      password: "pass",
    } as any;

    expect(() => editPullAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when user is missing", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryType: containerRegistryType.dockerhub,
      registryEndpoint: "example.com",
      password: "pass",
    } as any;

    expect(() => editPullAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is missing", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryType: containerRegistryType.dockerhub,
      registryEndpoint: "example.com",
      user: "user",
    } as any;

    expect(() => editPullAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle unicode characters in credentials", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "user-日本語",
      password: "password-汉字",
    };

    const result = editPullAccountRegistrySecret(existingSecret, input);
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));

    expect(config.auths["harbor.example.com"].username).toBe("user-日本語");
    expect(config.auths["harbor.example.com"].password).toBe("password-汉字");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: registrySecretName.regcred,
      } as unknown as KubeMetadata,
      type: "kubernetes.io/dockerconfigjson",
    };

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "testuser",
      password: "testpass",
    };

    const result = editPullAccountRegistrySecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(result.data?.[".dockerconfigjson"]).toBeDefined();
  });

  it("should not modify the original secret object", () => {
    const existingSecret = createExistingPullSecret();
    const originalData = existingSecret.data?.[".dockerconfigjson"];

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.modified.com",
      user: "modified-user",
      password: "modified-pass",
    };

    editPullAccountRegistrySecret(existingSecret, input);

    expect(existingSecret.data?.[".dockerconfigjson"]).toBe(originalData);
  });

  it("should preserve metadata without modifications", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "newuser",
      password: "newpass",
    };

    const result = editPullAccountRegistrySecret(existingSecret, input);

    expect(result.metadata).toEqual(existingSecret.metadata);
    expect(result.metadata.resourceVersion).toBe("12345");
  });

  it("should throw ZodError for invalid registryType", () => {
    const existingSecret = createExistingPullSecret();

    const input = {
      registryType: "invalid-type",
      registryEndpoint: "example.com",
      user: "user",
      password: "pass",
    } as any;

    expect(() => editPullAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });
});

describe("editPushAccountRegistrySecret", () => {
  const createExistingPushSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: registrySecretName["kaniko-docker-config"],
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "registry",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
      resourceVersion: "54321",
    } as unknown as KubeMetadata,
    type: "kubernetes.io/dockerconfigjson",
    data: {
      ".dockerconfigjson": Buffer.from(
        JSON.stringify({
          auths: {
            "harbor.example.com": {
              username: "old-user",
              password: "old-pass",
              auth: Buffer.from("old-user:old-pass", "utf-8").toString("base64"),
            },
          },
        }),
        "utf-8"
      ).toString("base64"),
    },
  });

  it("should update push account secret for ECR", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.ecr,
      registryEndpoint: "123456789.dkr.ecr.us-east-1.amazonaws.com",
      user: "AWS",
      password: "ecrtoken",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);

    expect(result.data?.[".dockerconfigjson"]).toBeDefined();

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.credsStore).toBe("ecr-login");
    expect(config.auths).toBeUndefined();
  });

  it("should update push account secret for Docker Hub", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.dockerhub,
      registryEndpoint: "https://index.docker.io/v1/",
      user: "dockeruser",
      password: "dockerpass",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT]).toBeDefined();
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT].username).toBe("dockeruser");
  });

  it("should update push account secret for Harbor", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.newexample.com",
      user: "newharboruser",
      password: "newharborpass",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths["harbor.newexample.com"]).toBeDefined();
    expect(config.auths["harbor.newexample.com"].username).toBe("newharboruser");
  });

  it("should update push account secret for OpenShift", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.openshift,
      registryEndpoint: "image-registry.openshift.example.com",
      user: "serviceaccount",
      password: "openshifttoken",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths["image-registry.openshift.example.com"]).toBeDefined();
    expect(config.auths["image-registry.openshift.example.com"].auth).toBeDefined();
    expect(config.auths["image-registry.openshift.example.com"].username).toBeUndefined();
    expect(config.auths["image-registry.openshift.example.com"].password).toBeUndefined();
  });

  it("should update push account secret for Nexus", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.nexus,
      registryEndpoint: "nexus.newexample.com",
      user: "newnexususer",
      password: "newnexuspass",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths["nexus.newexample.com"]).toBeDefined();
    expect(config.auths["nexus.newexample.com"].username).toBe("newnexususer");
  });

  it("should update push account secret for GHCR", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.ghcr,
      registryEndpoint: "ghcr.io",
      user: "ghcruser",
      password: "ghcrtoken",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths[GHCR_DEFAULT_REGISTRY_ENDPOINT]).toBeDefined();
    expect(config.auths[GHCR_DEFAULT_REGISTRY_ENDPOINT].username).toBe("ghcruser");
  });

  it("should throw ZodError when registryType is missing", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryEndpoint: "example.com",
      user: "user",
      password: "pass",
    } as any;

    expect(() => editPushAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError for invalid registryType", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: "invalid-type",
      registryEndpoint: "example.com",
      user: "user",
      password: "pass",
    } as any;

    expect(() => editPushAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle unicode characters for non-ECR registries", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "user-日本語",
      password: "password-пароль",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));

    expect(config.auths["harbor.example.com"].username).toBe("user-日本語");
    expect(config.auths["harbor.example.com"].password).toBe("password-пароль");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: registrySecretName["kaniko-docker-config"],
      } as unknown as KubeMetadata,
      type: "kubernetes.io/dockerconfigjson",
    };

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "testuser",
      password: "testpass",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(result.data?.[".dockerconfigjson"]).toBeDefined();
  });

  it("should not modify the original secret object", () => {
    const existingSecret = createExistingPushSecret();
    const originalData = existingSecret.data?.[".dockerconfigjson"];

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.modified.com",
      user: "modified-user",
      password: "modified-pass",
    };

    editPushAccountRegistrySecret(existingSecret, input);

    expect(existingSecret.data?.[".dockerconfigjson"]).toBe(originalData);
  });

  it("should preserve metadata without modifications", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "newuser",
      password: "newpass",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);

    expect(result.metadata).toEqual(existingSecret.metadata);
    expect(result.metadata.resourceVersion).toBe("54321");
  });

  it("should throw ZodError when registryEndpoint is missing", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      user: "user",
      password: "pass",
    } as any;

    expect(() => editPushAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle empty strings for credentials", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "",
      password: "",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));

    expect(config.auths["harbor.example.com"].username).toBe("");
    expect(config.auths["harbor.example.com"].password).toBe("");
  });

  it("should handle special characters in credentials", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "user!@#$%^&*()",
      password: "pass!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));

    expect(config.auths["harbor.example.com"].username).toBe("user!@#$%^&*()");
    expect(config.auths["harbor.example.com"].password).toBe("pass!@#$%^&*()_+-=[]{}|;:',.<>?/~`");
  });

  it("should handle very long credentials", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "a".repeat(1000),
      password: "b".repeat(1000),
    };

    const result = editPushAccountRegistrySecret(existingSecret, input);
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));

    expect(config.auths["harbor.example.com"].username).toBe("a".repeat(1000));
    expect(config.auths["harbor.example.com"].password).toBe("b".repeat(1000));
  });

  it("should throw ZodError when user is not a string", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: 123,
      password: "pass",
    } as any;

    expect(() => editPushAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is not a string", () => {
    const existingSecret = createExistingPushSecret();

    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "user",
      password: 456,
    } as any;

    expect(() => editPushAccountRegistrySecret(existingSecret, input)).toThrow(ZodError);
  });
});
