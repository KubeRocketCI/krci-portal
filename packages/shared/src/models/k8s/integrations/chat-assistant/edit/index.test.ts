import { describe, it, expect } from "vitest";
import { editChatAssistantIntegrationSecret } from "./index.js";
import { Secret } from "../../../groups/Core/index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";
import { KubeMetadata } from "../../../common/types.js";

describe("editChatAssistantIntegrationSecret", () => {
  const createExistingSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.CODEMIE,
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "chat-assistant",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
      annotations: {
        "some-annotation": "some-value",
      },
    } as unknown as KubeMetadata,
    type: "Opaque",
    data: {
      apiUrl: btoa("https://old-api.example.com"),
      assistantId: btoa("old-assistant-id"),
      token: btoa("old-token"),
      extraField: btoa("should-be-preserved"),
    },
  });

  it("should update all fields while preserving other data", () => {
    const existingSecret = createExistingSecret();

    const input = {
      apiUrl: "https://new-api.example.com",
      assistantId: "new-assistant-id",
      token: "new-token",
    };

    const result = editChatAssistantIntegrationSecret(existingSecret, input);

    // Verify updated data
    expect(atob(result.data?.apiUrl as string)).toBe("https://new-api.example.com");
    expect(atob(result.data?.assistantId as string)).toBe("new-assistant-id");
    expect(atob(result.data?.token as string)).toBe("new-token");

    // Verify other data fields are preserved
    expect(result.data?.extraField).toBe(btoa("should-be-preserved"));

    // Verify metadata is preserved
    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.labels).toEqual({
      [SECRET_LABEL_SECRET_TYPE]: "chat-assistant",
      [SECRET_LABEL_INTEGRATION_SECRET]: "true",
    });
    expect(result.metadata.annotations).toEqual({
      "some-annotation": "some-value",
    });

    // Verify immutability - original should not be modified
    expect(atob(existingSecret.data?.apiUrl as string)).toBe("https://old-api.example.com");
    expect(atob(existingSecret.data?.assistantId as string)).toBe("old-assistant-id");
    expect(atob(existingSecret.data?.token as string)).toBe("old-token");
  });

  it("should throw ZodError when apiUrl is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      assistantId: "new-assistant-id",
      token: "new-token",
    } as any;

    expect(() => editChatAssistantIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when assistantId is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      apiUrl: "https://new-api.example.com",
      token: "new-token",
    } as any;

    expect(() => editChatAssistantIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      apiUrl: "https://new-api.example.com",
      assistantId: "new-assistant-id",
    } as any;

    expect(() => editChatAssistantIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when apiUrl is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      apiUrl: 123,
      assistantId: "new-assistant-id",
      token: "new-token",
    } as any;

    expect(() => editChatAssistantIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when assistantId is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      apiUrl: "https://new-api.example.com",
      assistantId: 456,
      token: "new-token",
    } as any;

    expect(() => editChatAssistantIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      apiUrl: "https://new-api.example.com",
      assistantId: "new-assistant-id",
      token: false,
    } as any;

    expect(() => editChatAssistantIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      apiUrl: "",
      assistantId: "",
      token: "",
    };

    const result = editChatAssistantIntegrationSecret(existingSecret, input);

    expect(result.data?.apiUrl).toBe("");
    expect(result.data?.assistantId).toBe("");
    expect(result.data?.token).toBe("");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.CODEMIE,
      } as unknown as KubeMetadata,
      type: "Opaque",
    };

    const input = {
      apiUrl: "https://api.example.com",
      assistantId: "assistant-id",
      token: "token",
    };

    const result = editChatAssistantIntegrationSecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(atob(result.data?.apiUrl as string)).toBe("https://api.example.com");
    expect(atob(result.data?.assistantId as string)).toBe("assistant-id");
    expect(atob(result.data?.token as string)).toBe("token");
  });

  it("should handle special characters", () => {
    const existingSecret = createExistingSecret();

    const input = {
      apiUrl: "https://api.example.com:9090/path?key=value",
      assistantId: "assistant-with-special-chars_123",
      token: "token!@#$%^&*()",
    };

    const result = editChatAssistantIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.apiUrl as string)).toBe("https://api.example.com:9090/path?key=value");
    expect(atob(result.data?.assistantId as string)).toBe("assistant-with-special-chars_123");
    expect(atob(result.data?.token as string)).toBe("token!@#$%^&*()");
  });
});
