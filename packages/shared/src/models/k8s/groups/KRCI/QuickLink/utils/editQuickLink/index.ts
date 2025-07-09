import z, { ZodError } from "zod";
import { quickLinkSchema, editQuickLinkInputSchema } from "../../schema";
import { QuickLink, EditQuickLinkInput } from "../../types";

export const editQuickLink = (
  quickLink: QuickLink,
  input: EditQuickLinkInput
): QuickLink => {
  const parsedInput = editQuickLinkInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const updatedQuickLink: QuickLink = {
    ...quickLink,
    spec: {
      ...quickLink.spec,
      url: input.url,
      visible: input.visible,
      icon: input.icon,
    },
  };

  const parsedUpdatedQuickLink = quickLinkSchema.safeParse(updatedQuickLink);

  if (!parsedUpdatedQuickLink.success) {
    throw new ZodError(parsedUpdatedQuickLink.error.errors);
  }

  return parsedUpdatedQuickLink.data;
};
