import z from "zod";
import { gitProviderEnum, ciToolEnum, krciStatusEnum, protectedOperationsEnum } from "./schema.js";

export type GitProvider = z.infer<typeof gitProviderEnum>;
export type CITool = z.infer<typeof ciToolEnum>;

export type KrciStatus = z.infer<typeof krciStatusEnum>;

export type ProtectedOperation = z.infer<typeof protectedOperationsEnum>;
