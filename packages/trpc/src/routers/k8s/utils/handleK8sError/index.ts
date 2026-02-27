import { ApiException } from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import { K8sApiError } from "@my-project/shared";

type TRPCCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_SUPPORTED"
  | "TIMEOUT"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "UNPROCESSABLE_CONTENT"
  | "TOO_MANY_REQUESTS"
  | "CLIENT_CLOSED_REQUEST"
  | "INTERNAL_SERVER_ERROR";

// Map HTTP status codes to TRPC error codes
// Note: K8s API 401/403 errors are mapped to FORBIDDEN to distinguish them from
// session expiration errors (UNAUTHORIZED), preventing infinite login redirects
const HTTP_STATUS_TO_TRPC_CODE: Record<number, TRPCCode> = {
  400: "BAD_REQUEST",
  401: "FORBIDDEN", // K8s API auth errors should NOT trigger login redirect
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_SUPPORTED",
  408: "TIMEOUT",
  409: "CONFLICT",
  412: "PRECONDITION_FAILED",
  413: "PAYLOAD_TOO_LARGE",
  422: "UNPROCESSABLE_CONTENT",
  429: "TOO_MANY_REQUESTS",
  499: "CLIENT_CLOSED_REQUEST",
  500: "INTERNAL_SERVER_ERROR",
};

function getHttpStatusCode(error: unknown): number {
  if (error instanceof K8sApiError) {
    return error.statusCode;
  }
  if (error instanceof ApiException) {
    return typeof error.code === "number" ? error.code : 500;
  }
  return 500;
}

function getTRPCErrorCode(httpStatusCode: number) {
  return HTTP_STATUS_TO_TRPC_CODE[httpStatusCode] ?? "INTERNAL_SERVER_ERROR";
}

export function handleK8sError(error: unknown): TRPCError {
  // Handle custom K8sApiError
  if (error instanceof K8sApiError) {
    const httpStatusCode = error.statusCode;
    const trpcCode = getTRPCErrorCode(httpStatusCode);

    return new TRPCError({
      message: error.message,
      code: trpcCode,
      cause: {
        source: "k8s", // Mark as K8s error to prevent login redirect
        statusCode: error.statusCode,
        statusText: error.statusText,
        responseBody: error.responseBody,
      },
    });
  }

  // Handle Kubernetes client ApiException
  if (error instanceof ApiException) {
    let errorBody: {
      message: string;
      code?: string;
    } = {
      message: "",
      code: "",
    };

    // Safely parse error body
    try {
      if (error.body && typeof error.body === "string") {
        errorBody = JSON.parse(error.body);
      }
    } catch {
      // If parsing fails, use the raw body as message
      console.warn("Failed to parse K8s error body:", error.body);
      errorBody = { message: error.body };
    }

    const httpStatusCode = getHttpStatusCode(error);
    const trpcCode = getTRPCErrorCode(httpStatusCode);

    return new TRPCError({
      message: errorBody.message || error.message || "Kubernetes API error",
      code: trpcCode,
      cause: {
        ...errorBody,
        source: "k8s", // Mark as K8s error to prevent login redirect
      },
    });
  }

  // Handle generic errors
  return new TRPCError({
    message: (error as Error)?.message || "Unknown error",
    code: "INTERNAL_SERVER_ERROR",
  });
}
