import { TRPCError } from "@trpc/server";

export const ERROR_NO_SESSION_FOUND: TRPCError = {
  name: "TRPCError",
  code: "UNAUTHORIZED",
  message: "No session found.",
};

export const ERROR_TOKEN_EXPIRED: TRPCError = {
  name: "TRPCError",
  code: "UNAUTHORIZED",
  message: "Token has expired. Please log in again.",
};
