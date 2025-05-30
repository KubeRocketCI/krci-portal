import { z } from "zod";
import { OIDCUserSchema } from "../user/schema";

export const loginInputSchema = z.string();

export const loginCallbackInputSchema = z.string();

export const loginCallbackOutputSchema = z
  .object({
    success: z.boolean(),
    userInfo: OIDCUserSchema.optional(),
    clientSearch: z.string().optional(),
  })
  .strict();

export const loginOutputSchema = z
  .object({
    authUrl: z.string(),
  })
  .strict();

export const logoutOutputSchema = z.object({
  success: z.boolean(),
});

export const meOutputSchema = OIDCUserSchema.optional();
