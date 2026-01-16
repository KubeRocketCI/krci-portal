import { describe, it, expect } from "vitest";
import { getIntegrationSecretStatus, getClusterSecretStatus, editResource } from "./utils.js";
import {
  SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED,
  SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR,
  SECRET_ANNOTATION_CLUSTER_CONNECTED,
  SECRET_ANNOTATION_CLUSTER_ERROR,
} from "./constants.js";
import { Secret } from "../groups/Core/index.js";
import { z, ZodError } from "zod";
import { KubeMetadata } from "../common/types.js";

describe("getIntegrationSecretStatus", () => {
  it("should return connected and statusError from annotations", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
        annotations: {
          [SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED]: "true",
          [SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR]: "Some error",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = getIntegrationSecretStatus(secret);

    expect(result).toEqual({
      connected: "true",
      statusError: "Some error",
    });
  });

  it("should return undefined values when annotations are missing", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = getIntegrationSecretStatus(secret);

    expect(result).toEqual({
      connected: undefined,
      statusError: undefined,
    });
  });

  it("should return undefined values when metadata is missing", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = getIntegrationSecretStatus(secret);

    expect(result).toEqual({
      connected: undefined,
      statusError: undefined,
    });
  });

  it("should return partial values when only connected annotation exists", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-secret",
        annotations: {
          [SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED]: "false",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = getIntegrationSecretStatus(secret);

    expect(result).toEqual({
      connected: "false",
      statusError: undefined,
    });
  });
});

describe("getClusterSecretStatus", () => {
  it("should return connected and statusError from annotations", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-cluster-secret",
        annotations: {
          [SECRET_ANNOTATION_CLUSTER_CONNECTED]: "true",
          [SECRET_ANNOTATION_CLUSTER_ERROR]: "Connection error",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = getClusterSecretStatus(secret);

    expect(result).toEqual({
      connected: "true",
      statusError: "Connection error",
    });
  });

  it("should return undefined values when annotations are missing", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-cluster-secret",
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = getClusterSecretStatus(secret);

    expect(result).toEqual({
      connected: undefined,
      statusError: undefined,
    });
  });

  it("should return partial values when only error annotation exists", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-cluster-secret",
        annotations: {
          [SECRET_ANNOTATION_CLUSTER_ERROR]: "Failed to connect",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = getClusterSecretStatus(secret);

    expect(result).toEqual({
      connected: undefined,
      statusError: "Failed to connect",
    });
  });
});

describe("editResource", () => {
  interface TestResource {
    name: string;
    value: number;
    nested?: {
      field: string;
    };
  }

  const testSchema = z.object({
    value: z.number().min(0),
    field: z.string().optional(),
  });

  it("should validate input and apply updates using immer", () => {
    const existingResource: TestResource = {
      name: "test",
      value: 10,
    };

    const input = {
      value: 20,
      field: "updated",
    };

    const result = editResource(existingResource, input, testSchema, (draft, validatedInput) => {
      draft.value = validatedInput.value;
      draft.nested = {
        field: validatedInput.field || "",
      };
    });

    expect(result).toEqual({
      name: "test",
      value: 20,
      nested: {
        field: "updated",
      },
    });

    // Ensure immutability - original should not be modified
    expect(existingResource).toEqual({
      name: "test",
      value: 10,
    });
  });

  it("should throw ZodError when input validation fails", () => {
    const existingResource: TestResource = {
      name: "test",
      value: 10,
    };

    const input = {
      value: -1, // Invalid: min(0)
    };

    expect(() =>
      editResource(existingResource, input, testSchema, (draft, validatedInput) => {
        draft.value = validatedInput.value;
      })
    ).toThrow(ZodError);
  });

  it("should preserve existing fields not modified by updater", () => {
    const existingResource: TestResource = {
      name: "original",
      value: 5,
      nested: {
        field: "original-field",
      },
    };

    const input = {
      value: 15,
    };

    const result = editResource(existingResource, input, testSchema, (draft, validatedInput) => {
      draft.value = validatedInput.value;
    });

    expect(result).toEqual({
      name: "original",
      value: 15,
      nested: {
        field: "original-field",
      },
    });
  });

  it("should handle complex nested updates", () => {
    const existingResource: TestResource = {
      name: "test",
      value: 100,
      nested: {
        field: "old-value",
      },
    };

    const input = {
      value: 200,
      field: "new-value",
    };

    const result = editResource(existingResource, input, testSchema, (draft, validatedInput) => {
      draft.value = validatedInput.value;
      if (draft.nested && validatedInput.field) {
        draft.nested.field = validatedInput.field;
      }
    });

    expect(result).toEqual({
      name: "test",
      value: 200,
      nested: {
        field: "new-value",
      },
    });
  });
});
