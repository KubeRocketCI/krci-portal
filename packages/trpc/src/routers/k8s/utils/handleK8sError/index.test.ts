import { describe, expect, test } from "vitest";
import { handleK8sError } from "./index.js";
import { TRPCError } from "@trpc/server";
import { ApiException } from "@kubernetes/client-node";
import { K8sApiError } from "@my-project/shared";

describe("handleK8sError", () => {
  describe("K8sApiError handling", () => {
    test("converts 400 to BAD_REQUEST", () => {
      const error = new K8sApiError(400, "Bad Request", "Error body");
      const result = handleK8sError(error);

      expect(result).toBeInstanceOf(TRPCError);
      expect(result.code).toBe("BAD_REQUEST");
      expect(result.message).toBe("Kubernetes API request failed: 400 Bad Request. Error body");
      expect(result.cause).toHaveProperty("statusCode", 400);
    });

    test("converts 401 to FORBIDDEN (K8s auth errors should not trigger login redirect)", () => {
      const error = new K8sApiError(401, "Unauthorized", "");
      const result = handleK8sError(error);

      expect(result.code).toBe("FORBIDDEN");
      expect(result.cause).toHaveProperty("source", "k8s");
    });

    test("converts 403 to FORBIDDEN", () => {
      const error = new K8sApiError(403, "Forbidden", "");
      const result = handleK8sError(error);

      expect(result.code).toBe("FORBIDDEN");
    });

    test("converts 404 to NOT_FOUND", () => {
      const error = new K8sApiError(404, "Not Found", "");
      const result = handleK8sError(error);

      expect(result.code).toBe("NOT_FOUND");
    });

    test("converts 409 to CONFLICT", () => {
      const error = new K8sApiError(409, "Conflict", "");
      const result = handleK8sError(error);

      expect(result.code).toBe("CONFLICT");
    });

    test("converts 500 to INTERNAL_SERVER_ERROR", () => {
      const error = new K8sApiError(500, "Internal Server Error", "");
      const result = handleK8sError(error);

      expect(result.code).toBe("INTERNAL_SERVER_ERROR");
    });

    test("preserves error details in cause", () => {
      const error = new K8sApiError(400, "Bad Request", "Error body");
      const result = handleK8sError(error);

      expect(result.cause).toMatchObject({
        source: "k8s",
        statusCode: 400,
        statusText: "Bad Request",
        responseBody: "Error body",
      });
    });

    test("adds source metadata to distinguish K8s errors from session errors", () => {
      const error403 = new K8sApiError(403, "Forbidden", "");
      const result403 = handleK8sError(error403);

      expect(result403.cause).toHaveProperty("source", "k8s");

      const error401 = new K8sApiError(401, "Unauthorized", "");
      const result401 = handleK8sError(error401);

      expect(result401.cause).toHaveProperty("source", "k8s");
    });

    test("defaults to INTERNAL_SERVER_ERROR for unknown status codes", () => {
      const error = new K8sApiError(999, "Unknown", "");
      const result = handleK8sError(error);

      expect(result.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("ApiException handling", () => {
    test("converts ApiException with numeric code", () => {
      const error = new ApiException(
        404,
        "Not Found",
        {} as unknown as { [key: string]: string },
        {} as unknown as { [key: string]: string }
      );
      const result = handleK8sError(error);

      expect(result).toBeInstanceOf(TRPCError);
      expect(result.code).toBe("NOT_FOUND");
    });

    test("parses JSON error body from ApiException", () => {
      const errorBody = JSON.stringify({ message: "Resource not found", code: "NOT_FOUND" });
      const error = new ApiException(
        404,
        "Not Found",
        errorBody as unknown as { [key: string]: string },
        {} as unknown as { [key: string]: string }
      );
      const result = handleK8sError(error);

      expect(result.message).toBe("Resource not found");
    });

    test("handles non-JSON error body from ApiException", () => {
      const error = new ApiException(
        404,
        "Not Found",
        "Plain text error" as unknown as { [key: string]: string },
        {} as unknown as { [key: string]: string }
      );
      const result = handleK8sError(error);

      expect(result.message).toBe("Plain text error");
    });

    test("uses error.message as fallback when body parsing fails", () => {
      const error = new ApiException(
        404,
        "Not Found",
        "Invalid JSON {" as unknown as { [key: string]: string },
        {} as unknown as { [key: string]: string }
      );
      const result = handleK8sError(error);

      expect(result.message).toBe("Invalid JSON {");
    });

    test("defaults to INTERNAL_SERVER_ERROR for non-numeric code", () => {
      const error = new ApiException(
        "unknown" as unknown as number,
        "Error",
        {} as unknown as { [key: string]: string },
        {} as unknown as { [key: string]: string }
      );
      const result = handleK8sError(error);

      expect(result.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("Generic error handling", () => {
    test("handles generic Error objects", () => {
      const error = new Error("Generic error");
      const result = handleK8sError(error);

      expect(result).toBeInstanceOf(TRPCError);
      expect(result.code).toBe("INTERNAL_SERVER_ERROR");
      expect(result.message).toBe("Generic error");
    });

    test("handles errors without message", () => {
      const error = {};
      const result = handleK8sError(error);

      expect(result.code).toBe("INTERNAL_SERVER_ERROR");
      expect(result.message).toBe("Unknown error");
    });

    test("handles null/undefined", () => {
      const result1 = handleK8sError(null);
      const result2 = handleK8sError(undefined);

      expect(result1.code).toBe("INTERNAL_SERVER_ERROR");
      expect(result2.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});
