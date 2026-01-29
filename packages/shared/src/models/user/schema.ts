import z from "zod";

export const OIDCUserSchema = z.object({
  email: z.string(),
  email_verified: z.boolean().optional(),
  family_name: z.string().optional(),
  given_name: z.string().optional(),
  name: z.string(),
  preferred_username: z.string().optional(),
  sub: z.string(),
  picture: z.string().optional(),
  default_namespace: z.string().optional(),
  groups: z.array(z.string()).optional(),
});
