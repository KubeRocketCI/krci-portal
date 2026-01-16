import { describe, it, expect } from "vitest";
import { createSonarQubeIntegrationSecretDraft } from "./index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";

describe("createSonarQubeIntegrationSecretDraft", () => {
  it("should create a valid SonarQube integration secret draft", () => {
    const input = {
      token: "test-token-123",
      url: "https://sonarqube.example.com",
    };

    const result = createSonarQubeIntegrationSecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.SONAR,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "sonar",
          [SECRET_LABEL_INTEGRATION_SECRET]: "true",
        },
      },
      type: "Opaque",
    });

    // Verify data is base64 encoded
    expect(result.data?.token).toBeDefined();
    expect(result.data?.url).toBeDefined();
    expect(typeof result.data?.token).toBe("string");
    expect(typeof result.data?.url).toBe("string");

    // Decode and verify the values
    expect(atob(result.data?.token as string)).toBe("test-token-123");
    expect(atob(result.data?.url as string)).toBe("https://sonarqube.example.com");
  });

  it("should throw ZodError when token is missing", () => {
    const input = {
      url: "https://sonarqube.example.com",
    } as any;

    expect(() => createSonarQubeIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is missing", () => {
    const input = {
      token: "test-token-123",
    } as any;

    expect(() => createSonarQubeIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when both fields are missing", () => {
    const input = {} as any;

    expect(() => createSonarQubeIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is not a string", () => {
    const input = {
      token: 123,
      url: "https://sonarqube.example.com",
    } as any;

    expect(() => createSonarQubeIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is not a string", () => {
    const input = {
      token: "test-token-123",
      url: 456,
    } as any;

    expect(() => createSonarQubeIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const input = {
      token: "",
      url: "",
    };

    const result = createSonarQubeIntegrationSecretDraft(input);

    expect(result.data?.token).toBe("");
    expect(result.data?.url).toBe("");
  });

  it("should handle special characters in token and url", () => {
    const input = {
      token: "token-with-special-chars!@#$%^&*()",
      url: "https://sonarqube.example.com:9000/path?query=value",
    };

    const result = createSonarQubeIntegrationSecretDraft(input);

    expect(atob(result.data?.token as string)).toBe("token-with-special-chars!@#$%^&*()");
    expect(atob(result.data?.url as string)).toBe("https://sonarqube.example.com:9000/path?query=value");
  });
});
