import { describe, it, expect } from "vitest";
import { editSSOIntegrationSecret } from "./index.js";
import { Secret } from "../../../groups/Core/index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE } from "../../constants.js";
import { KubeMetadata } from "../../../common/types.js";

describe("editSSOIntegrationSecret", () => {
  const createExistingSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.SSO,
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "keycloak",
      },
      annotations: {
        "some-annotation": "some-value",
      },
    } as unknown as KubeMetadata,
    type: "Opaque",
    data: {
      username: btoa("old-username"),
      password: btoa("old-password"),
      extraField: btoa("should-be-preserved"),
    },
  });

  it("should update username and password while preserving other fields", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: "new-password-456",
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    // Verify updated data
    expect(atob(result.data?.username as string)).toBe("new-username");
    expect(atob(result.data?.password as string)).toBe("new-password-456");

    // Verify other data fields are preserved
    expect(result.data?.extraField).toBe(btoa("should-be-preserved"));

    // Verify metadata is preserved
    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.labels).toEqual({
      [SECRET_LABEL_SECRET_TYPE]: "keycloak",
    });
    expect(result.metadata.annotations).toEqual({
      "some-annotation": "some-value",
    });

    // Verify immutability - original should not be modified
    expect(atob(existingSecret.data?.username as string)).toBe("old-username");
    expect(atob(existingSecret.data?.password as string)).toBe("old-password");
  });

  it("should throw ZodError when username is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      password: "new-password-456",
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: 123,
      password: "new-password-456",
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: 789,
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "",
      password: "",
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    expect(result.data?.username).toBe("");
    expect(result.data?.password).toBe("");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.SSO,
      } as unknown as KubeMetadata,
      type: "Opaque",
    };

    const input = {
      username: "new-username",
      password: "new-password",
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(atob(result.data?.username as string)).toBe("new-username");
    expect(atob(result.data?.password as string)).toBe("new-password");
  });

  it("should handle special characters in username and password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "user-with-special!@#$%",
      password: "password!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.username as string)).toBe("user-with-special!@#$%");
    expect(atob(result.data?.password as string)).toBe("password!@#$%^&*()_+-=[]{}|;:',.<>?/~`");
  });

  it("should preserve existing data fields not in input", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.SSO,
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        username: btoa("old-username"),
        password: btoa("old-password"),
        customField1: btoa("custom-value-1"),
        customField2: btoa("custom-value-2"),
      },
    };

    const input = {
      username: "updated-username",
      password: "updated-password",
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.username as string)).toBe("updated-username");
    expect(atob(result.data?.password as string)).toBe("updated-password");
    expect(result.data?.customField1).toBe(btoa("custom-value-1"));
    expect(result.data?.customField2).toBe(btoa("custom-value-2"));
  });

  it("should handle unicode characters in username and password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "user-日本語-汉字",
      password: "пароль-пароль-123",
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("user-日本語-汉字");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("пароль-пароль-123");
  });

  it("should handle very long username and password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "a".repeat(1000),
      password: "b".repeat(1000),
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.username as string)).toBe("a".repeat(1000));
    expect(atob(result.data?.password as string)).toBe("b".repeat(1000));
  });

  it("should handle whitespace in username and password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "  user with spaces  ",
      password: "password\twith\ttabs\nand\nnewlines",
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.username as string)).toBe("  user with spaces  ");
    expect(atob(result.data?.password as string)).toBe("password\twith\ttabs\nand\nnewlines");
  });

  it("should not modify the original secret object", () => {
    const existingSecret = createExistingSecret();
    const originalUsername = existingSecret.data?.username;
    const originalPassword = existingSecret.data?.password;
    const originalExtraField = existingSecret.data?.extraField;

    const input = {
      username: "modified-username",
      password: "modified-password",
    };

    editSSOIntegrationSecret(existingSecret, input);

    // Verify original is unchanged
    expect(existingSecret.data?.username).toBe(originalUsername);
    expect(existingSecret.data?.password).toBe(originalPassword);
    expect(existingSecret.data?.extraField).toBe(originalExtraField);
  });

  it("should throw ZodError when username is null", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: null,
      password: "new-password",
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is null", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: null,
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is undefined", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: undefined,
      password: "new-password",
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is undefined", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: undefined,
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when both fields are missing", () => {
    const existingSecret = createExistingSecret();

    const input = {} as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is a boolean", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: true,
      password: "new-password",
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is a boolean", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: false,
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is an object", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: { value: "new-username" },
      password: "new-password",
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is an object", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: { value: "new-password" },
    } as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when input is an array", () => {
    const existingSecret = createExistingSecret();

    const input = ["new-username", "new-password"] as any;

    expect(() => editSSOIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should preserve metadata without modifications", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.SSO,
        namespace: "test-namespace",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "keycloak",
          "custom-label": "custom-value",
        },
        annotations: {
          "annotation-1": "value-1",
          "annotation-2": "value-2",
        },
        resourceVersion: "12345",
        uid: "test-uid-123",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
      type: "Opaque",
      data: {
        username: btoa("old-username"),
        password: btoa("old-password"),
      },
    };

    const input = {
      username: "new-username",
      password: "new-password",
    };

    const result = editSSOIntegrationSecret(existingSecret, input);

    expect(result.metadata).toEqual(existingSecret.metadata);
    expect(result.metadata.resourceVersion).toBe("12345");
    expect(result.metadata.uid).toBe("test-uid-123");
  });
});
