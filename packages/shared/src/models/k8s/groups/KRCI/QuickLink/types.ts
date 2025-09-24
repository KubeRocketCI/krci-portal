import z from "zod";
import { quickLinkDraftSchema, quickLinkSchema } from ".";

export type QuickLink = z.infer<typeof quickLinkSchema>;
export type QuickLinkDraft = z.infer<typeof quickLinkDraftSchema>;
