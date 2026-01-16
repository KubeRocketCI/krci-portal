import { describe, it, expect } from "vitest";
import { createChatAssistantIntegrationSecretDraft } from "./index.js";
import { ZodError } from "zod";
import { KubeMetadata } from "../../../common/types.js";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";

describe("createChatAssistantIntegrationSecretDraft", () => {
  it("should create a valid Chat Assistant integration secret draft", () => {
    const input = {
      apiUrl: "https://api.chat-assistant.example.com",
      assistantId: "assistant-123",
      token: "test-token-456",
    };

    const result = createChatAssistantIntegrationSecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.CODEMIE,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "chat-assistant",
          [SECRET_LABEL_INTEGRATION_SECRET]: "true",
        },
      },
      type: "Opaque",
    });

    // Verify data is base64 encoded
    expect(result.data?.apiUrl).toBeDefined();
    expect(result.data?.assistantId).toBeDefined();
    expect(result.data?.token).toBeDefined();

    // Decode and verify the values
    expect(atob(result.data?.apiUrl as string)).toBe("https://api.chat-assistant.example.com");
    expect(atob(result.data?.assistantId as string)).toBe("assistant-123");
    expect(atob(result.data?.token as string)).toBe("test-token-456");
  });

  it("should throw ZodError when apiUrl is missing", () => {
    const input = {
      assistantId: "assistant-123",
      token: "test-token-456",
    } as any;

    expect(() => createChatAssistantIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when assistantId is missing", () => {
    const input = {
      apiUrl: "https://api.chat-assistant.example.com",
      token: "test-token-456",
    } as any;

    expect(() => createChatAssistantIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is missing", () => {
    const input = {
      apiUrl: "https://api.chat-assistant.example.com",
      assistantId: "assistant-123",
    } as any;

    expect(() => createChatAssistantIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when all fields are missing", () => {
    const input = {} as any;

    expect(() => createChatAssistantIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when apiUrl is not a string", () => {
    const input = {
      apiUrl: 123,
      assistantId: "assistant-123",
      token: "test-token-456",
    } as any;

    expect(() => createChatAssistantIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when assistantId is not a string", () => {
    const input = {
      apiUrl: "https://api.chat-assistant.example.com",
      assistantId: 456,
      token: "test-token-789",
    } as any;

    expect(() => createChatAssistantIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is not a string", () => {
    const input = {
      apiUrl: "https://api.chat-assistant.example.com",
      assistantId: "assistant-123",
      token: true,
    } as any;

    expect(() => createChatAssistantIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const input = {
      apiUrl: "",
      assistantId: "",
      token: "",
    };

    const result = createChatAssistantIntegrationSecretDraft(input);

    expect(result.data?.apiUrl).toBe("");
    expect(result.data?.assistantId).toBe("");
    expect(result.data?.token).toBe("");
  });

  it("should handle special characters", () => {
    const input = {
      apiUrl: "https://api.example.com:8080/path?query=value",
      assistantId: "assistant-with-dashes-123",
      token: "token!@#$%^&*()",
    };

    const result = createChatAssistantIntegrationSecretDraft(input);

    expect(atob(result.data?.apiUrl as string)).toBe("https://api.example.com:8080/path?query=value");
    expect(atob(result.data?.assistantId as string)).toBe("assistant-with-dashes-123");
    expect(atob(result.data?.token as string)).toBe("token!@#$%^&*()");
  });
});
