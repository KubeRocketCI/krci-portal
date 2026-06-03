import { z } from "zod";
import {
  loginInputSchema,
  loginCallbackInputSchema,
  loginCallbackOutputSchema,
  loginOutputSchema,
  logoutOutputSchema,
  meOutputSchema,
  loginWithTokenInputSchema,
  loginWithTokenOutputSchema,
  loginWithSATokenInputSchema,
  loginWithSATokenOutputSchema,
} from "./schema.js";

export type LoginInput = z.infer<typeof loginInputSchema>;

export type LoginCallbackInput = z.infer<typeof loginCallbackInputSchema>;

export type LoginCallbackOutput = z.infer<typeof loginCallbackOutputSchema>;

export type LoginOutput = z.infer<typeof loginOutputSchema>;

export type LogoutOutput = z.infer<typeof logoutOutputSchema>;

export type MeOutput = z.infer<typeof meOutputSchema>;

export type LoginWithTokenInput = z.infer<typeof loginWithTokenInputSchema>;

export type LoginWithTokenOutput = z.infer<typeof loginWithTokenOutputSchema>;

export type LoginWithSATokenInput = z.infer<typeof loginWithSATokenInputSchema>;

export type LoginWithSATokenOutput = z.infer<typeof loginWithSATokenOutputSchema>;
