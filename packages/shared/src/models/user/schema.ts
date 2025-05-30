import z from "zod";

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
