import { describe, expect, it } from "vitest";
import { createCodemieDraftSecret } from "./index";
import { codemieSecretLabels } from "@my-project/shared";
import { safeEncode } from "@/core/utils/decodeEncode";

describe("K8sCodemie: createResourceDraftSecret", () => {
  it("should return a valid CodemieDraftSecret object", () => {
    const result = createCodemieDraftSecret({
      name: "my-codemie",
      clientId: "client-123",
      clientSecret: "secret-456",
    });

    expect(result).toEqual({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "my-codemie",
        labels: {
          [codemieSecretLabels.secretType]: "codemie",
        },
      },
      data: {
        client_id: safeEncode("client-123"),
        client_secret: safeEncode("secret-456"),
      },
      type: "Opaque",
    });
  });

  it("should correctly set the metadata name", () => {
    const name = "test-codemie";
    const result = createCodemieDraftSecret({
      name,
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    });

    expect(result.metadata.name).toBe(name);
  });

  it("should correctly encode the client ID and secret", () => {
    const clientId = "test-client-id-123";
    const clientSecret = "test-client-secret-456";

    const result = createCodemieDraftSecret({
      name: "test-codemie",
      clientId,
      clientSecret,
    });

    expect(result.data.client_id).toBe(safeEncode(clientId));
    expect(result.data.client_secret).toBe(safeEncode(clientSecret));
  });

  it("should use the correct Secret type", () => {
    const result = createCodemieDraftSecret({
      name: "test-codemie",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    });

    expect(result.type).toBe("Opaque");
  });

  it("should set the correct label for codemie secret type", () => {
    const result = createCodemieDraftSecret({
      name: "test-codemie",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    });

    expect(result.metadata.labels).toHaveProperty(
      codemieSecretLabels.secretType
    );
    expect(result.metadata.labels[codemieSecretLabels.secretType]).toBe(
      "codemie"
    );
  });

  it("should handle empty strings for clientId and clientSecret", () => {
    const result = createCodemieDraftSecret({
      name: "empty-credentials",
      clientId: "",
      clientSecret: "",
    });

    expect(result.data.client_id).toBe(safeEncode(""));
    expect(result.data.client_secret).toBe(safeEncode(""));
  });
});
