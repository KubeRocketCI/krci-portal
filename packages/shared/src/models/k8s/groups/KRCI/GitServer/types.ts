import z from "zod";
import { gitServerSchema, gitServerDraftSchema } from "../index.js";

export type GitServer = z.infer<typeof gitServerSchema>;
export type GitServerDraft = z.infer<typeof gitServerDraftSchema>;
