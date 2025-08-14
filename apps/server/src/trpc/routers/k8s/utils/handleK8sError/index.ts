import { ApiException } from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import { HTTP_CODE_TO_JSONRPC2 } from "@trpc/server/unstable-core-do-not-import";

export function handleK8sError(error: unknown): TRPCError {
  if (error instanceof ApiException) {
    let errorBody: any = {};

    // Safely parse error body
    try {
      if (error.body && typeof error.body === "string") {
        errorBody = JSON.parse(error.body);
      }
    } catch (parseError) {
      // If parsing fails, use the raw body as message
      console.warn("Failed to parse K8s error body:", error.body);
      errorBody = { message: error.body };
    }

    return new TRPCError({
      message: errorBody.message || error.message || "Kubernetes API error",
      cause: errorBody,
      code: HTTP_CODE_TO_JSONRPC2[errorBody.code] || "INTERNAL_SERVER_ERROR",
    });
  }

  return new TRPCError({
    message: (error as Error)?.message || "Unknown error",
    code: "INTERNAL_SERVER_ERROR",
  });
}
