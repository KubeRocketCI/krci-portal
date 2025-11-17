import z from "zod";
import { gitProviderEnum, ciToolEnum, protectedOperationsEnum } from "./schema.js";

export type GitProvider = z.infer<typeof gitProviderEnum>;
export type CITool = z.infer<typeof ciToolEnum>;

export type ProtectedOperation = z.infer<typeof protectedOperationsEnum>;
