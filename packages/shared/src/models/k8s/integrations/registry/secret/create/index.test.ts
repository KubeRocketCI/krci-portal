import { describe, it, expect } from "vitest";
import {
  createPullAccountRegistrySecretDraft,
  createPushAccountRegistrySecretDraft,
  parseRegistrySecretUserProtectedData,
  parseRegistrySecretAuth,
} from "./index.js";
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

describe("createPullAccountRegistrySecretDraft", () => {
  it("should create a valid pull account secret for Docker Hub", () => {
    const input = {
      registryType: containerRegistryType.dockerhub,
      registryEndpoint: "https://index.docker.io/v1/",
      user: "dockeruser",
      password: "dockerpass",
    };

    const result = createPullAccountRegistrySecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: registrySecretName.regcred,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "registry",
          [SECRET_LABEL_INTEGRATION_SECRET]: "true",
        },
      },
      type: "kubernetes.io/dockerconfigjson",
    });

    expect(result.data?.[".dockerconfigjson"]).toBeDefined();
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT]).toBeDefined();
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT].username).toBe("dockeruser");
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT].password).toBe("dockerpass");
  });

  it("should create a valid pull account secret for GHCR", () => {
    const input = {
      registryType: containerRegistryType.ghcr,
      registryEndpoint: "ghcr.io",
      user: "ghcruser",
      password: "ghcrtoken",
    };

    const result = createPullAccountRegistrySecretDraft(input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths[GHCR_DEFAULT_REGISTRY_ENDPOINT]).toBeDefined();
    expect(config.auths[GHCR_DEFAULT_REGISTRY_ENDPOINT].username).toBe("ghcruser");
  });

  it("should create a valid pull account secret for Harbor", () => {
    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "harboruser",
      password: "harborpass",
    };

    const result = createPullAccountRegistrySecretDraft(input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths["harbor.example.com"]).toBeDefined();
    expect(config.auths["harbor.example.com"].username).toBe("harboruser");
  });

  it("should throw ZodError when registryType is missing", () => {
    const input = {
      registryEndpoint: "example.com",
      user: "user",
      password: "pass",
    } as any;

    expect(() => createPullAccountRegistrySecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when user is missing", () => {
    const input = {
      registryType: containerRegistryType.dockerhub,
      registryEndpoint: "example.com",
      password: "pass",
    } as any;

    expect(() => createPullAccountRegistrySecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is missing", () => {
    const input = {
      registryType: containerRegistryType.dockerhub,
      registryEndpoint: "example.com",
      user: "user",
    } as any;

    expect(() => createPullAccountRegistrySecretDraft(input)).toThrow(ZodError);
  });

  it("should handle unicode characters in credentials", () => {
    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "user-日本語",
      password: "password-汉字",
    };

    const result = createPullAccountRegistrySecretDraft(input);
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));

    expect(config.auths["harbor.example.com"].username).toBe("user-日本語");
    expect(config.auths["harbor.example.com"].password).toBe("password-汉字");
  });
});

describe("createPushAccountRegistrySecretDraft", () => {
  it("should create a valid push account secret for ECR", () => {
    const input = {
      registryType: containerRegistryType.ecr,
      registryEndpoint: "123456789.dkr.ecr.us-east-1.amazonaws.com",
      user: "AWS",
      password: "ecrtoken",
    };

    const result = createPushAccountRegistrySecretDraft(input);

    expect(result.metadata.name).toBe(registrySecretName["kaniko-docker-config"]);
    expect(result.data?.[".dockerconfigjson"]).toBeDefined();

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.credsStore).toBe("ecr-login");
    expect(config.auths).toBeUndefined();
  });

  it("should create a valid push account secret for Docker Hub", () => {
    const input = {
      registryType: containerRegistryType.dockerhub,
      registryEndpoint: "https://index.docker.io/v1/",
      user: "dockeruser",
      password: "dockerpass",
    };

    const result = createPushAccountRegistrySecretDraft(input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT]).toBeDefined();
    expect(config.auths[DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT].username).toBe("dockeruser");
  });

  it("should create a valid push account secret for Harbor", () => {
    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "harboruser",
      password: "harborpass",
    };

    const result = createPushAccountRegistrySecretDraft(input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths["harbor.example.com"]).toBeDefined();
  });

  it("should create a valid push account secret for OpenShift", () => {
    const input = {
      registryType: containerRegistryType.openshift,
      registryEndpoint: "image-registry.openshift.example.com",
      user: "serviceaccount",
      password: "openshifttoken",
    };

    const result = createPushAccountRegistrySecretDraft(input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths["image-registry.openshift.example.com"]).toBeDefined();
    expect(config.auths["image-registry.openshift.example.com"].auth).toBeDefined();
    expect(config.auths["image-registry.openshift.example.com"].username).toBeUndefined();
    expect(config.auths["image-registry.openshift.example.com"].password).toBeUndefined();
  });

  it("should create a valid push account secret for Nexus", () => {
    const input = {
      registryType: containerRegistryType.nexus,
      registryEndpoint: "nexus.example.com",
      user: "nexususer",
      password: "nexuspass",
    };

    const result = createPushAccountRegistrySecretDraft(input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths["nexus.example.com"]).toBeDefined();
  });

  it("should create a valid push account secret for GHCR", () => {
    const input = {
      registryType: containerRegistryType.ghcr,
      registryEndpoint: "ghcr.io",
      user: "ghcruser",
      password: "ghcrtoken",
    };

    const result = createPushAccountRegistrySecretDraft(input);

    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));
    expect(config.auths[GHCR_DEFAULT_REGISTRY_ENDPOINT]).toBeDefined();
  });

  it("should throw ZodError when registryType is missing", () => {
    const input = {
      registryEndpoint: "example.com",
      user: "user",
      password: "pass",
    } as any;

    expect(() => createPushAccountRegistrySecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError for invalid registryType", () => {
    const input = {
      registryType: "invalid-type",
      registryEndpoint: "example.com",
      user: "user",
      password: "pass",
    } as any;

    expect(() => createPushAccountRegistrySecretDraft(input)).toThrow(ZodError);
  });

  it("should handle unicode characters for non-ECR registries", () => {
    const input = {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "user-日本語",
      password: "password-пароль",
    };

    const result = createPushAccountRegistrySecretDraft(input);
    const config = JSON.parse(Buffer.from(result.data?.[".dockerconfigjson"] as string, "base64").toString("utf-8"));

    expect(config.auths["harbor.example.com"].username).toBe("user-日本語");
    expect(config.auths["harbor.example.com"].password).toBe("password-пароль");
  });
});

describe("parseRegistrySecretUserProtectedData", () => {
  it("should parse username and password from secret", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "kubernetes.io/dockerconfigjson",
      data: {
        ".dockerconfigjson": Buffer.from(
          JSON.stringify({
            auths: {
              "harbor.example.com": {
                username: "testuser",
                password: "testpass",
              },
            },
          }),
          "utf-8"
        ).toString("base64"),
      },
    };

    const result = parseRegistrySecretUserProtectedData(secret);

    expect(result.userName).toBe("testuser");
    expect(result.password).toBe("testpass");
  });

  it("should return undefined values when secret is undefined", () => {
    const result = parseRegistrySecretUserProtectedData(undefined);

    expect(result.userName).toBeUndefined();
    expect(result.password).toBeUndefined();
  });

  it("should return undefined values when dockerconfigjson is missing", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = parseRegistrySecretUserProtectedData(secret);

    expect(result.userName).toBeUndefined();
    expect(result.password).toBeUndefined();
  });

  it("should return undefined values when auths field is missing (ECR case)", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "kubernetes.io/dockerconfigjson",
      data: {
        ".dockerconfigjson": Buffer.from(
          JSON.stringify({
            credsStore: "ecr-login",
          }),
          "utf-8"
        ).toString("base64"),
      },
    };

    const result = parseRegistrySecretUserProtectedData(secret);

    expect(result.userName).toBeUndefined();
    expect(result.password).toBeUndefined();
  });

  it("should handle unicode characters in credentials", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "kubernetes.io/dockerconfigjson",
      data: {
        ".dockerconfigjson": Buffer.from(
          JSON.stringify({
            auths: {
              "harbor.example.com": {
                username: "user-日本語",
                password: "pass-汉字",
              },
            },
          }),
          "utf-8"
        ).toString("base64"),
      },
    };

    const result = parseRegistrySecretUserProtectedData(secret);

    expect(result.userName).toBe("user-日本語");
    expect(result.password).toBe("pass-汉字");
  });
});

describe("parseRegistrySecretAuth", () => {
  it("should parse auth from secret", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "kubernetes.io/dockerconfigjson",
      data: {
        ".dockerconfigjson": Buffer.from(
          JSON.stringify({
            auths: {
              "harbor.example.com": {
                auth: "dGVzdHVzZXI6dGVzdHBhc3M=",
              },
            },
          }),
          "utf-8"
        ).toString("base64"),
      },
    };

    const result = parseRegistrySecretAuth(secret);

    expect(result.auth).toBe("dGVzdHVzZXI6dGVzdHBhc3M=");
  });

  it("should return undefined auth when secret is undefined", () => {
    const result = parseRegistrySecretAuth(undefined);

    expect(result.auth).toBeUndefined();
  });

  it("should return undefined auth when dockerconfigjson is missing", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = parseRegistrySecretAuth(secret);

    expect(result.auth).toBeUndefined();
  });

  it("should return undefined auth when auths field is missing", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "kubernetes.io/dockerconfigjson",
      data: {
        ".dockerconfigjson": Buffer.from(
          JSON.stringify({
            credsStore: "ecr-login",
          }),
          "utf-8"
        ).toString("base64"),
      },
    };

    const result = parseRegistrySecretAuth(secret);

    expect(result.auth).toBeUndefined();
  });
});
