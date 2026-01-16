import { describe, it, expect } from "vitest";
import { createDefectDojoIntegrationSecretDraft } from "./index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";

describe("createDefectDojoIntegrationSecretDraft", () => {
  it("should create a valid DefectDojo integration secret draft", () => {
    const input = {
      token: "test-token-123",
      url: "https://defectdojo.example.com",
    };

    const result = createDefectDojoIntegrationSecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.DEFECT_DOJO,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "defectdojo",
          [SECRET_LABEL_INTEGRATION_SECRET]: "true",
        },
      },
      type: "Opaque",
    });

    expect(atob(result.data?.token as string)).toBe("test-token-123");
    expect(atob(result.data?.url as string)).toBe("https://defectdojo.example.com");
  });

  it("should throw ZodError when token is missing", () => {
    const input = {
      url: "https://defectdojo.example.com",
    } as any;

    expect(() => createDefectDojoIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is missing", () => {
    const input = {
      token: "test-token-123",
    } as any;

    expect(() => createDefectDojoIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const input = {
      token: "",
      url: "",
    };

    const result = createDefectDojoIntegrationSecretDraft(input);

    expect(result.data?.token).toBe("");
    expect(result.data?.url).toBe("");
  });

  it("should handle special characters", () => {
    const input = {
      token: "token-with-special!@#$%",
      url: "https://defectdojo.example.com:8080/path?query=value",
    };

    const result = createDefectDojoIntegrationSecretDraft(input);

    expect(atob(result.data?.token as string)).toBe("token-with-special!@#$%");
    expect(atob(result.data?.url as string)).toBe("https://defectdojo.example.com:8080/path?query=value");
  });
});
