import { TRPCError } from "@trpc/server";
import { resolvePortalRoles, type PortalRole } from "@my-project/shared";
import { protectedProcedure } from "../protected/index.js";
import { ERROR_ROLE_FORBIDDEN } from "./errors.js";

// Server-side enforcement gate. Roles are resolved through the SAME source-aware path
// as `auth.me`/login (`resolvePortalRoles`): only OIDC identities carry roles, so an SA
// session is denied regardless of its Kubernetes groups. `protectedProcedure` does NOT
// narrow `ctx.session.user`, so an absent user/authSource fail-closes to "serviceaccount"
// → no roles → denied. As tRPC middleware, the check runs before the procedure body.
export function authorizedProcedure(role: PortalRole) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const user = ctx.session.user;
    const roles = resolvePortalRoles(user?.authSource ?? "serviceaccount", user?.data?.groups);

    if (!roles.includes(role)) {
      throw new TRPCError(ERROR_ROLE_FORBIDDEN);
    }

    return next({ ctx });
  });
}

export const adminProcedure = authorizedProcedure("administrator");
