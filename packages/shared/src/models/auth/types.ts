import { z } from "zod";
import {
  loginInputSchema,
  loginCallbackInputSchema,
  loginCallbackOutputSchema,
  loginOutputSchema,
  logoutOutputSchema,
  meOutputSchema,
} from "./schema";

export type LoginInput = z.infer<typeof loginInputSchema>;

export type LoginCallbackInput = z.infer<typeof loginCallbackInputSchema>;

export type LoginCallbackOutput = z.infer<typeof loginCallbackOutputSchema>;

export type LoginOutput = z.infer<typeof loginOutputSchema>;

export type LogoutnOutput = z.infer<typeof logoutOutputSchema>;

export type MeOutput = z.infer<typeof meOutputSchema>;
