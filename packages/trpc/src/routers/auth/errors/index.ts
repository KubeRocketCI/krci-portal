import { TRPCError } from "@trpc/server";

export const ERROR_NO_SESSION_FOUND: TRPCError = {
  name: "TRPCError",
  code: "UNAUTHORIZED",
  message: "No session found.",
};
