import { describe, it, expect } from "vitest";
import { editCodemieSecret } from "./index.js";
import { Secret } from "../../../../groups/Core/index.js";
import { ZodError } from "zod";
import { SECRET_LABEL_SECRET_TYPE } from "../../../constants.js";
import { KubeMetadata } from "../../../../common/types.js";

describe("editCodemieSecret", () => {
  const createExistingSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: "test-codemie-secret",
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "codemie",
      },
      annotations: {
        "some-annotation": "some-value",
      },
    } as unknown as KubeMetadata,
    type: "Opaque",
    data: {
      client_id: Buffer.from("old-client-id", "utf-8").toString("base64"),
      client_secret: Buffer.from("old-client-secret", "utf-8").toString("base64"),
      extraField: Buffer.from("should-be-preserved", "utf-8").toString("base64"),
    },
  });

  it("should update clientId and clientSecret while preserving other fields", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: "new-client-id",
      clientSecret: "new-client-secret",
    };

    const result = editCodemieSecret(existingSecret, input);

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe("new-client-id");
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe("new-client-secret");

    expect(result.data?.extraField).toBe(Buffer.from("should-be-preserved", "utf-8").toString("base64"));

    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.labels).toEqual({
      [SECRET_LABEL_SECRET_TYPE]: "codemie",
    });
    expect(result.metadata.annotations).toEqual({
      "some-annotation": "some-value",
    });

    expect(Buffer.from(existingSecret.data?.client_id as string, "base64").toString("utf-8")).toBe("old-client-id");
    expect(Buffer.from(existingSecret.data?.client_secret as string, "base64").toString("utf-8")).toBe(
      "old-client-secret"
    );
  });

  it("should throw ZodError when clientId is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientSecret: "new-client-secret",
    } as any;

    expect(() => editCodemieSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientSecret is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: "new-client-id",
    } as any;

    expect(() => editCodemieSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when both fields are missing", () => {
    const existingSecret = createExistingSecret();

    const input = {} as any;

    expect(() => editCodemieSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientId is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: 123,
      clientSecret: "new-client-secret",
    } as any;

    expect(() => editCodemieSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientSecret is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: "new-client-id",
      clientSecret: 456,
    } as any;

    expect(() => editCodemieSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: "",
      clientSecret: "",
    };

    const result = editCodemieSecret(existingSecret, input);

    expect(result.data?.client_id).toBe("");
    expect(result.data?.client_secret).toBe("");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-codemie-secret",
      } as unknown as KubeMetadata,
      type: "Opaque",
    };

    const input = {
      clientId: "new-client-id",
      clientSecret: "new-client-secret",
    };

    const result = editCodemieSecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe("new-client-id");
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe("new-client-secret");
  });

  it("should handle special characters", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: "client-id-with-special!@#$%",
      clientSecret: "secret-with-special^&*()_+-=[]{}",
    };

    const result = editCodemieSecret(existingSecret, input);

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe(
      "client-id-with-special!@#$%"
    );
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe(
      "secret-with-special^&*()_+-=[]{}"
    );
  });

  it("should handle unicode characters", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: "client-日本語-汉字",
      clientSecret: "secret-пароль-123",
    };

    const result = editCodemieSecret(existingSecret, input);

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe("client-日本語-汉字");
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe("secret-пароль-123");
  });

  it("should preserve existing data fields not in input", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-codemie-secret",
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        client_id: Buffer.from("old-client-id", "utf-8").toString("base64"),
        client_secret: Buffer.from("old-client-secret", "utf-8").toString("base64"),
        customField1: Buffer.from("custom-value-1", "utf-8").toString("base64"),
        customField2: Buffer.from("custom-value-2", "utf-8").toString("base64"),
      },
    };

    const input = {
      clientId: "updated-client-id",
      clientSecret: "updated-client-secret",
    };

    const result = editCodemieSecret(existingSecret, input);

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe("updated-client-id");
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe("updated-client-secret");
    expect(result.data?.customField1).toBe(Buffer.from("custom-value-1", "utf-8").toString("base64"));
    expect(result.data?.customField2).toBe(Buffer.from("custom-value-2", "utf-8").toString("base64"));
  });

  it("should not modify the original secret object", () => {
    const existingSecret = createExistingSecret();
    const originalClientId = existingSecret.data?.client_id;
    const originalClientSecret = existingSecret.data?.client_secret;
    const originalExtraField = existingSecret.data?.extraField;

    const input = {
      clientId: "modified-client-id",
      clientSecret: "modified-client-secret",
    };

    editCodemieSecret(existingSecret, input);

    expect(existingSecret.data?.client_id).toBe(originalClientId);
    expect(existingSecret.data?.client_secret).toBe(originalClientSecret);
    expect(existingSecret.data?.extraField).toBe(originalExtraField);
  });

  it("should throw ZodError when clientId is null", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: null,
      clientSecret: "new-client-secret",
    } as any;

    expect(() => editCodemieSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientSecret is null", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: "new-client-id",
      clientSecret: null,
    } as any;

    expect(() => editCodemieSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle very long credentials", () => {
    const existingSecret = createExistingSecret();

    const input = {
      clientId: "client-".repeat(100),
      clientSecret: "secret-".repeat(100),
    };

    const result = editCodemieSecret(existingSecret, input);

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe("client-".repeat(100));
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe("secret-".repeat(100));
  });

  it("should preserve metadata without modifications", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-codemie-secret",
        namespace: "production",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "codemie",
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
        client_id: Buffer.from("old-client-id", "utf-8").toString("base64"),
        client_secret: Buffer.from("old-client-secret", "utf-8").toString("base64"),
      },
    };

    const input = {
      clientId: "new-client-id",
      clientSecret: "new-client-secret",
    };

    const result = editCodemieSecret(existingSecret, input);

    expect(result.metadata).toEqual(existingSecret.metadata);
    expect(result.metadata.resourceVersion).toBe("54321");
    expect(result.metadata.uid).toBe("test-uid-456");
  });
});
