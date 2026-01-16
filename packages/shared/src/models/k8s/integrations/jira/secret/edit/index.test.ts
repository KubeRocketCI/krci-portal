import { describe, it, expect } from "vitest";
import { editJiraIntegrationSecret } from "./index.js";
import { Secret } from "../../../../groups/Core/index.js";
import { ZodError } from "zod";
import {
  integrationSecretName,
  SECRET_LABEL_SECRET_TYPE,
  SECRET_LABEL_INTEGRATION_SECRET,
} from "../../../constants.js";
import { KubeMetadata } from "../../../../common/types.js";

describe("editJiraIntegrationSecret", () => {
  const createExistingSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.JIRA,
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "jira",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
      annotations: {
        "some-annotation": "some-value",
      },
    } as unknown as KubeMetadata,
    type: "Opaque",
    data: {
      username: Buffer.from("old-username", "utf-8").toString("base64"),
      password: Buffer.from("old-password", "utf-8").toString("base64"),
      extraField: Buffer.from("should-be-preserved", "utf-8").toString("base64"),
    },
  });

  it("should update username and password while preserving other fields", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: "new-password-456",
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("new-username");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("new-password-456");

    expect(result.data?.extraField).toBe(Buffer.from("should-be-preserved", "utf-8").toString("base64"));

    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.labels).toEqual({
      [SECRET_LABEL_SECRET_TYPE]: "jira",
      [SECRET_LABEL_INTEGRATION_SECRET]: "true",
    });
    expect(result.metadata.annotations).toEqual({
      "some-annotation": "some-value",
    });

    expect(Buffer.from(existingSecret.data?.username as string, "base64").toString("utf-8")).toBe("old-username");
    expect(Buffer.from(existingSecret.data?.password as string, "base64").toString("utf-8")).toBe("old-password");
  });

  it("should throw ZodError when username is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      password: "new-password-456",
    } as any;

    expect(() => editJiraIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
    } as any;

    expect(() => editJiraIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when both fields are missing", () => {
    const existingSecret = createExistingSecret();

    const input = {} as any;

    expect(() => editJiraIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: 123,
      password: "new-password-456",
    } as any;

    expect(() => editJiraIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: 789,
    } as any;

    expect(() => editJiraIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "",
      password: "",
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(result.data?.username).toBe("");
    expect(result.data?.password).toBe("");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.JIRA,
      } as unknown as KubeMetadata,
      type: "Opaque",
    };

    const input = {
      username: "new-username",
      password: "new-password",
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("new-username");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("new-password");
  });

  it("should handle special characters in username and password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "user-with-special!@#$%",
      password: "password!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("user-with-special!@#$%");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe(
      "password!@#$%^&*()_+-=[]{}|;:',.<>?/~`"
    );
  });

  it("should handle unicode characters in username and password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "user-日本語-汉字",
      password: "пароль-123",
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("user-日本語-汉字");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("пароль-123");
  });

  it("should preserve existing data fields not in input", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.JIRA,
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        username: Buffer.from("old-username", "utf-8").toString("base64"),
        password: Buffer.from("old-password", "utf-8").toString("base64"),
        customField1: Buffer.from("custom-value-1", "utf-8").toString("base64"),
        customField2: Buffer.from("custom-value-2", "utf-8").toString("base64"),
      },
    };

    const input = {
      username: "updated-username",
      password: "updated-password",
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("updated-username");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("updated-password");
    expect(result.data?.customField1).toBe(Buffer.from("custom-value-1", "utf-8").toString("base64"));
    expect(result.data?.customField2).toBe(Buffer.from("custom-value-2", "utf-8").toString("base64"));
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

    editJiraIntegrationSecret(existingSecret, input);

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

    expect(() => editJiraIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is null", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-username",
      password: null,
    } as any;

    expect(() => editJiraIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle very long username and password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "a".repeat(1000),
      password: "b".repeat(1000),
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("a".repeat(1000));
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("b".repeat(1000));
  });

  it("should handle whitespace in username and password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "  user with spaces  ",
      password: "password\twith\ttabs\nand\nnewlines",
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("  user with spaces  ");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe(
      "password\twith\ttabs\nand\nnewlines"
    );
  });

  it("should preserve metadata without modifications", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.JIRA,
        namespace: "production",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "jira",
          [SECRET_LABEL_INTEGRATION_SECRET]: "true",
          "custom-label": "custom-value",
        },
        annotations: {
          "annotation-1": "value-1",
        },
        resourceVersion: "54321",
        uid: "test-uid-456",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
      type: "Opaque",
      data: {
        username: Buffer.from("old-username", "utf-8").toString("base64"),
        password: Buffer.from("old-password", "utf-8").toString("base64"),
      },
    };

    const input = {
      username: "new-username",
      password: "new-password",
    };

    const result = editJiraIntegrationSecret(existingSecret, input);

    expect(result.metadata).toEqual(existingSecret.metadata);
    expect(result.metadata.resourceVersion).toBe("54321");
    expect(result.metadata.uid).toBe("test-uid-456");
  });
});
