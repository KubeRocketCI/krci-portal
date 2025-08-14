import { ApiException } from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import { HTTP_CODE_TO_JSONRPC2 } from "@trpc/server/unstable-core-do-not-import";

export function handleK8sError(error: unknown): TRPCError {
  if (error instanceof ApiException) {
    const errorBody = JSON.parse(error.body || "{}");
    return new TRPCError({
      message: error.body.message,
      cause: error.body,
      code: HTTP_CODE_TO_JSONRPC2[errorBody.code],
    });
  }

  return new TRPCError({
    message: (error as Error)?.message || "Unknown error",
    code: "INTERNAL_SERVER_ERROR",
  });
}
