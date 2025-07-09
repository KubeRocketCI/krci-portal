import z from "zod";
import {
  createQuickLinkDraftInputSchema,
  quickLinkDraftSchema,
  quickLinkSchema,
  editQuickLinkInputSchema,
} from ".";

export type QuickLink = z.infer<typeof quickLinkSchema>;
export type QuickLinkDraft = z.infer<typeof quickLinkDraftSchema>;

export type CreateQuickLinkDraftInput = z.infer<
  typeof createQuickLinkDraftInputSchema
>;
export type EditQuickLinkInput = z.infer<typeof editQuickLinkInputSchema>;
