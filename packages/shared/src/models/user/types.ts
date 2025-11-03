import z from "zod";
import { OIDCUserSchema } from "./schema";

export type OIDCUser = z.infer<typeof OIDCUserSchema>;
