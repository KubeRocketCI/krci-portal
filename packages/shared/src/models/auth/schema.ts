import { z } from "zod";
import { OIDCUserSchema } from "../user/schema.js";
import { portalRoleSchema } from "../role/schema.js";

export const loginInputSchema = z.string().startsWith("/");

export const loginCallbackInputSchema = z.string();

// Shared success-output shape for login procedures that establish a session
// (callback, direct token, SA token): success flag, resolved user identity
// (with optional OIDC issuer URL), and the client-side redirect query.
// `roles` mirrors `auth.me` so the client caches a role-aware user right after login
// and role guards don't fail closed until the next background refetch.
export const loginSuccessOutputSchema = z
  .object({
    success: z.boolean(),
    userInfo: OIDCUserSchema.extend({
      issuerUrl: z.string().optional(),
      roles: z.array(portalRoleSchema),
    }).optional(),
    clientSearch: z.string().optional(),
  })
  .strict();

export const loginCallbackOutputSchema = loginSuccessOutputSchema;

export const loginOutputSchema = z
  .object({
    authUrl: z.string(),
  })
  .strict();

export const logoutOutputSchema = z.object({
  success: z.boolean(),
  endSessionUrl: z.string().optional(),
});

export const meOutputSchema = OIDCUserSchema.optional();

export const loginWithTokenInputSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    redirectSearchParam: z.string().startsWith("/").optional(),
  })
  .strict();

export const loginWithTokenOutputSchema = loginSuccessOutputSchema;

export const loginWithSATokenInputSchema = z
  .object({
    token: z.string().min(1, "Service account token is required"),
    redirectSearchParam: z.string().startsWith("/").optional(),
  })
  .strict();

export const loginWithSATokenOutputSchema = loginSuccessOutputSchema;
