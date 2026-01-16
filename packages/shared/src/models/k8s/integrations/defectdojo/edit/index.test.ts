import { describe, it, expect } from "vitest";
import { editDefectDojoIntegrationSecret } from "./index.js";
import { Secret } from "../../../groups/Core/index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";
import { KubeMetadata } from "../../../common/types.js";

describe("editDefectDojoIntegrationSecret", () => {
  const createExistingSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.DEFECT_DOJO,
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "defectdojo",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
      annotations: {
        "some-annotation": "some-value",
      },
    } as unknown as KubeMetadata,
    type: "Opaque",
    data: {
      token: btoa("old-token"),
      url: btoa("https://old-defectdojo.example.com"),
      extraField: btoa("should-be-preserved"),
    },
  });

  it("should update token and url while preserving other fields", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "new-token-456",
      url: "https://new-defectdojo.example.com",
    };

    const result = editDefectDojoIntegrationSecret(existingSecret, input);

    // Verify updated data
    expect(atob(result.data?.token as string)).toBe("new-token-456");
    expect(atob(result.data?.url as string)).toBe("https://new-defectdojo.example.com");

    // Verify other data fields are preserved
    expect(result.data?.extraField).toBe(btoa("should-be-preserved"));

    // Verify metadata is preserved
    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.labels).toEqual({
      [SECRET_LABEL_SECRET_TYPE]: "defectdojo",
      [SECRET_LABEL_INTEGRATION_SECRET]: "true",
    });
    expect(result.metadata.annotations).toEqual({
      "some-annotation": "some-value",
    });

    // Verify immutability - original should not be modified
    expect(atob(existingSecret.data?.token as string)).toBe("old-token");
    expect(atob(existingSecret.data?.url as string)).toBe("https://old-defectdojo.example.com");
  });

  it("should throw ZodError when token is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      url: "https://new-defectdojo.example.com",
    } as any;

    expect(() => editDefectDojoIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "new-token-456",
    } as any;

    expect(() => editDefectDojoIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: 123,
      url: "https://new-defectdojo.example.com",
    } as any;

    expect(() => editDefectDojoIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "new-token-456",
      url: 789,
    } as any;

    expect(() => editDefectDojoIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "",
      url: "",
    };

    const result = editDefectDojoIntegrationSecret(existingSecret, input);

    expect(result.data?.token).toBe("");
    expect(result.data?.url).toBe("");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.DEFECT_DOJO,
      } as unknown as KubeMetadata,
      type: "Opaque",
    };

    const input = {
      token: "new-token",
      url: "https://defectdojo.example.com",
    };

    const result = editDefectDojoIntegrationSecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(atob(result.data?.token as string)).toBe("new-token");
    expect(atob(result.data?.url as string)).toBe("https://defectdojo.example.com");
  });

  it("should handle special characters in token and url", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "token-with-special!@#$%",
      url: "https://defectdojo.example.com:9090/api?key=value&other=data",
    };

    const result = editDefectDojoIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.token as string)).toBe("token-with-special!@#$%");
    expect(atob(result.data?.url as string)).toBe("https://defectdojo.example.com:9090/api?key=value&other=data");
  });
});
