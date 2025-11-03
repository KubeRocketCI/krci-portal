import z, { ZodError } from "zod";
import { quickLinkSchema } from "../../schema";
import { QuickLink } from "../../types";

const editQuickLinkInputSchema = z.object({
  url: z.string(),
  visible: z.boolean(),
  icon: z.string(),
});

export const editQuickLink = (quickLink: QuickLink, input: z.infer<typeof editQuickLinkInputSchema>): QuickLink => {
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

const editQuickLinkURLInputSchema = z.object({
  url: z.string(),
});

export const editQuickLinkURL = (
  quickLink: QuickLink,
  input: z.infer<typeof editQuickLinkURLInputSchema>
): QuickLink => {
  const parsedInput = editQuickLinkURLInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const updatedQuickLink: QuickLink = {
    ...quickLink,
    spec: {
      ...quickLink.spec,
      url: input.url,
    },
  };

  const parsedUpdatedQuickLink = quickLinkSchema.safeParse(updatedQuickLink);

  if (!parsedUpdatedQuickLink.success) {
    throw new ZodError(parsedUpdatedQuickLink.error.errors);
  }

  return parsedUpdatedQuickLink.data;
};
