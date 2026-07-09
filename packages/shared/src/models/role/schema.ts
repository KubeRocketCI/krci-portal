import { z } from "zod";
import { ALL_ROLES, type PortalRole } from "./types.js";

// Validates the `roles` array returned on `auth.me` — the server-computed verdict the
// client reads (`user.roles.includes(role)`) instead of re-deriving roles from raw
// group claims.
export const portalRoleSchema = z.enum(ALL_ROLES as [PortalRole, ...PortalRole[]]);
