import z, { ZodError } from "zod";
import { k8sQuickLinkConfig } from "../../constants.js";
import { quickLinkDraftSchema } from "../../schema.js";
import { QuickLinkDraft } from "../../types.js";

const { kind, apiVersion } = k8sQuickLinkConfig;

const createQuickLinkDraftInputSchema = z.object({
  name: z.string(),
  icon: z.string(),
  url: z.string(),
  visible: z.boolean(),
});

export const createQuickLinkDraft = (input: z.infer<typeof createQuickLinkDraftInputSchema>): QuickLinkDraft => {
  const parsedInput = createQuickLinkDraftInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: QuickLinkDraft = {
    apiVersion,
    kind,
    metadata: {
      name: input.name,
    },
    spec: {
      type: "default",
      icon: input.icon,
      url: input.url,
      visible: input.visible,
    },
  };

  const parsedDraft = quickLinkDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
