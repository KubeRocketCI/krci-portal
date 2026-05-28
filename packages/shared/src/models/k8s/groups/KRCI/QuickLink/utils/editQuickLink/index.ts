import z, { ZodError } from "zod";
import { QuickLink } from "../../types.js";

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

  // Preserve the original object (including server-managed fields) and only
  // overwrite editable spec fields. The full object is intentionally NOT
  // re-validated against quickLinkSchema: a live resource can diverge from the
  // strict schema and would otherwise fail validation here.
  return {
    ...quickLink,
    spec: {
      ...quickLink.spec,
      url: parsedInput.data.url,
      visible: parsedInput.data.visible,
      icon: parsedInput.data.icon,
    },
  };
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

  // Preserve the original object and only overwrite the editable url. The full
  // object is intentionally NOT re-validated against quickLinkSchema: a live
  // resource can diverge from the strict schema and would otherwise fail here.
  return {
    ...quickLink,
    spec: {
      ...quickLink.spec,
      url: parsedInput.data.url,
    },
  };
};
