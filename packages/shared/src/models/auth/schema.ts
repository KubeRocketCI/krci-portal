import { z } from "zod";
import { OIDCUserSchema } from "../user/schema.js";

export const loginInputSchema = z.string();

export const loginCallbackInputSchema = z.string();

export const loginCallbackOutputSchema = z
  .object({
    success: z.boolean(),
    userInfo: OIDCUserSchema.extend({
      issuerUrl: z.string().optional(),
    }).optional(),
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
  endSessionUrl: z.string().optional(),
});

export const meOutputSchema = OIDCUserSchema.optional();

export const loginWithTokenInputSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    redirectSearchParam: z.string().optional(),
  })
  .strict();

export const loginWithTokenOutputSchema = z
  .object({
    success: z.boolean(),
    userInfo: OIDCUserSchema.extend({
      issuerUrl: z.string().optional(),
    }).optional(),
    clientSearch: z.string().optional(),
  })
  .strict();
