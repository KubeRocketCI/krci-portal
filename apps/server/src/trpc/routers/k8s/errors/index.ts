import { TRPCError } from "@trpc/server";

export const ERROR_K8S_CLIENT_NOT_INITIALIZED: TRPCError = {
  name: "TRPCError",
  code: "INTERNAL_SERVER_ERROR",
  message: "K8sClient is not initialized.",
};
