import { describe, it, expect } from "vitest";
import { editRegistryServiceAccount } from "./index.js";
import { ZodError } from "zod";
import { IRSA_ROLE_ARN_ANNOTATION } from "../../constants.js";
import { ServiceAccount } from "../../../../groups/Core/index.js";
import { KubeMetadata } from "../../../../common/types.js";

describe("editRegistryServiceAccount", () => {
  const createExistingServiceAccount = (): ServiceAccount => ({
    apiVersion: "v1",
    kind: "ServiceAccount",
    metadata: {
      name: "kaniko",
      namespace: "default",
      annotations: {
        [IRSA_ROLE_ARN_ANNOTATION]: "arn:aws:iam::123456789012:role/old-role",
        "other-annotation": "other-value",
      },
      resourceVersion: "12345",
    } as unknown as KubeMetadata,
  });

  it("should update IRSA role ARN annotation", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/new-ecr-role",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe("arn:aws:iam::123456789012:role/new-ecr-role");
  });

  it("should preserve other annotations", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/new-role",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.["other-annotation"]).toBe("other-value");
  });

  it("should create annotations object if it doesn't exist", () => {
    const existingServiceAccount: ServiceAccount = {
      apiVersion: "v1",
      kind: "ServiceAccount",
      metadata: {
        name: "kaniko",
        namespace: "default",
      } as unknown as KubeMetadata,
    };

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/ecr-role",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations).toBeDefined();
    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe("arn:aws:iam::123456789012:role/ecr-role");
  });

  it("should throw ZodError when irsaRoleArn is missing", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {} as any;

    expect(() => editRegistryServiceAccount(existingServiceAccount, input)).toThrow(ZodError);
  });

  it("should throw ZodError when irsaRoleArn is not a string", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: 123,
    } as any;

    expect(() => editRegistryServiceAccount(existingServiceAccount, input)).toThrow(ZodError);
  });

  it("should handle different AWS account IDs", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "arn:aws:iam::999888777666:role/different-account-role",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe(
      "arn:aws:iam::999888777666:role/different-account-role"
    );
  });

  it("should handle different AWS regions", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "arn:aws-us-gov:iam::123456789012:role/gov-role",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe(
      "arn:aws-us-gov:iam::123456789012:role/gov-role"
    );
  });

  it("should handle role ARN with path", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/path/to/role-name",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe(
      "arn:aws:iam::123456789012:role/path/to/role-name"
    );
  });

  it("should handle empty string for irsaRoleArn", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe("");
  });

  it("should handle very long role ARN", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const longRoleArn = `arn:aws:iam::123456789012:role/${"a".repeat(500)}`;

    const input = {
      irsaRoleArn: longRoleArn,
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe(longRoleArn);
  });

  it("should handle special characters in role ARN", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/role-with-special_chars.123",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe(
      "arn:aws:iam::123456789012:role/role-with-special_chars.123"
    );
  });

  it("should not modify the original ServiceAccount object", () => {
    const existingServiceAccount = createExistingServiceAccount();
    const originalAnnotations = existingServiceAccount.metadata.annotations;
    const originalRoleArn = existingServiceAccount.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION];

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/modified-role",
    };

    editRegistryServiceAccount(existingServiceAccount, input);

    expect(existingServiceAccount.metadata.annotations).toBe(originalAnnotations);
    expect(existingServiceAccount.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe(originalRoleArn);
  });

  it("should preserve all metadata fields", () => {
    const existingServiceAccount: ServiceAccount = {
      apiVersion: "v1",
      kind: "ServiceAccount",
      metadata: {
        name: "kaniko",
        namespace: "production",
        labels: {
          app: "kaniko",
          "custom-label": "custom-value",
        },
        annotations: {
          [IRSA_ROLE_ARN_ANNOTATION]: "arn:aws:iam::123456789012:role/old-role",
          "annotation-1": "value-1",
        },
        resourceVersion: "54321",
        uid: "test-uid-456",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
    };

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/new-role",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.name).toBe("kaniko");
    expect(result.metadata.namespace).toBe("production");
    expect(result.metadata.labels).toEqual(existingServiceAccount.metadata.labels);
    expect(result.metadata.resourceVersion).toBe("54321");
    expect(result.metadata.uid).toBe("test-uid-456");
  });

  it("should throw ZodError when irsaRoleArn is null", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: null,
    } as any;

    expect(() => editRegistryServiceAccount(existingServiceAccount, input)).toThrow(ZodError);
  });

  it("should throw ZodError when irsaRoleArn is undefined", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: undefined,
    } as any;

    expect(() => editRegistryServiceAccount(existingServiceAccount, input)).toThrow(ZodError);
  });

  it("should throw ZodError when irsaRoleArn is a boolean", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: true,
    } as any;

    expect(() => editRegistryServiceAccount(existingServiceAccount, input)).toThrow(ZodError);
  });

  it("should throw ZodError when irsaRoleArn is an object", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: { arn: "arn:aws:iam::123456789012:role/role" },
    } as any;

    expect(() => editRegistryServiceAccount(existingServiceAccount, input)).toThrow(ZodError);
  });

  it("should throw ZodError when irsaRoleArn is an array", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: ["arn:aws:iam::123456789012:role/role"],
    } as any;

    expect(() => editRegistryServiceAccount(existingServiceAccount, input)).toThrow(ZodError);
  });

  it("should handle non-ARN string values", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "not-a-valid-arn",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe("not-a-valid-arn");
  });

  it("should preserve existing imagePullSecrets field", () => {
    const existingServiceAccount: ServiceAccount = {
      apiVersion: "v1",
      kind: "ServiceAccount",
      metadata: {
        name: "kaniko",
        namespace: "default",
        annotations: {
          [IRSA_ROLE_ARN_ANNOTATION]: "arn:aws:iam::123456789012:role/old-role",
        },
      } as unknown as KubeMetadata,
      imagePullSecrets: [{ name: "regcred" }, { name: "other-secret" }],
    };

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/new-role",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.imagePullSecrets).toEqual([{ name: "regcred" }, { name: "other-secret" }]);
  });

  it("should preserve existing secrets field", () => {
    const existingServiceAccount: ServiceAccount = {
      apiVersion: "v1",
      kind: "ServiceAccount",
      metadata: {
        name: "kaniko",
        namespace: "default",
        annotations: {
          [IRSA_ROLE_ARN_ANNOTATION]: "arn:aws:iam::123456789012:role/old-role",
        },
      } as unknown as KubeMetadata,
      secrets: [{ name: "token-secret" }],
    };

    const input = {
      irsaRoleArn: "arn:aws:iam::123456789012:role/new-role",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.secrets).toEqual([{ name: "token-secret" }]);
  });

  it("should handle whitespace in irsaRoleArn", () => {
    const existingServiceAccount = createExistingServiceAccount();

    const input = {
      irsaRoleArn: "  arn:aws:iam::123456789012:role/role-with-spaces  ",
    };

    const result = editRegistryServiceAccount(existingServiceAccount, input);

    expect(result.metadata.annotations?.[IRSA_ROLE_ARN_ANNOTATION]).toBe(
      "  arn:aws:iam::123456789012:role/role-with-spaces  "
    );
  });
});
