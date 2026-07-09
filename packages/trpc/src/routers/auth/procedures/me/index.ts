import { MeOutput, OIDCUserSchema, portalRoleSchema, resolvePortalRoles } from "@my-project/shared";
import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";

export const authMeProcedure = protectedProcedure
  .output(
    OIDCUserSchema.extend({
      issuerUrl: z.string().optional(),
      // Server-computed verdict. Sourced ONLY from Keycloak (OIDC) group claims via
      // `PORTAL_ADMIN_GROUPS`; SA sessions always resolve to `[]` (see resolvePortalRoles).
      // The client reads this directly (`roles.includes(role)`) — it never re-derives
      // roles from raw group claims and never sees the group→role binding.
      roles: z.array(portalRoleSchema),
    }).optional()
  )
  .query(async ({ ctx }) => {
    const sessionUser = ctx.session.user;
    const userData = sessionUser?.data satisfies MeOutput;
    if (!userData || !sessionUser) {
      return undefined;
    }

    return {
      ...userData,
      issuerUrl: ctx.oidcConfig.issuerURL || undefined,
      roles: resolvePortalRoles(sessionUser.authSource, userData.groups),
    };
  });
