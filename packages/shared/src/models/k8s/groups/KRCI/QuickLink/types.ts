import z from "zod";
import { quickLinkDraftSchema, quickLinkSchema } from "./index.js";

export type QuickLink = z.infer<typeof quickLinkSchema>;
export type QuickLinkDraft = z.infer<typeof quickLinkDraftSchema>;
