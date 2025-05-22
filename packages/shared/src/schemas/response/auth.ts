import { z } from "zod";

export const loginInputSchema = z.string();
export type LoginInput = z.infer<typeof loginInputSchema>;

export const loginCallbackInputSchema = z.string();
export type LoginCallbackInput = z.infer<typeof loginCallbackInputSchema>;

export const OIDCUserSchema = z.object({
  email: z.string(),
  email_verified: z.boolean(),
  family_name: z.string(),
  given_name: z.string(),
  name: z.string(),
  preferred_username: z.string(),
  sub: z.string(),
  picture: z.string().optional(),
  default_namespace: z.string().optional(),
  groups: z.array(z.string()).optional(),
});
export type OIDCUser = z.infer<typeof OIDCUserSchema>;

export const loginCallbackOutputSchema = z
  .object({
    success: z.boolean(),
    userInfo: OIDCUserSchema.optional(),
    clientSearch: z.string().optional(),
  })
  .strict();
export type LoginCallbackOutput = z.infer<typeof loginCallbackOutputSchema>;

export const loginOutputSchema = z
  .object({
    authUrl: z.string(),
  })
  .strict();
export type LoginOutput = z.infer<typeof loginOutputSchema>;

export const logoutOutputSchema = z.object({
  success: z.boolean(),
});
export type LogoutnOutput = z.infer<typeof logoutOutputSchema>;

export const meOutputSchema = OIDCUserSchema.optional();
export type MeOutput = z.infer<typeof meOutputSchema>;
