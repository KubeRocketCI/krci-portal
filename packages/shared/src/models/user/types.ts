import z from "zod";
import { OIDCUserSchema } from "./schema.js";

export type OIDCUser = z.infer<typeof OIDCUserSchema>;
