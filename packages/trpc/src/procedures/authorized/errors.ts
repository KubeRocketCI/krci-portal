import { TRPCError } from "@trpc/server";

// FORBIDDEN, never UNAUTHORIZED: the global client error handler redirects to the
// OIDC login flow only on UNAUTHORIZED (see apps/client/src/core/providers/trpc/utils.ts
// isAuthError). A role denial is not a session expiry and must not bounce an
// authenticated-but-unauthorized user back through Keycloak.
export const ERROR_ROLE_FORBIDDEN: TRPCError = {
  name: "TRPCError",
  code: "FORBIDDEN",
  message: "You do not have permission to perform this action.",
};
