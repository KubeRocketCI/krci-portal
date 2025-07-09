import z, { ZodError } from "zod";
import { k8sQuickLinkConfig } from "../../constants";
import {
  quickLinkDraftSchema,
  createQuickLinkDraftInputSchema,
} from "../../schema";
import { QuickLinkDraft, CreateQuickLinkDraftInput } from "../../types";

const { kind, apiVersion } = k8sQuickLinkConfig;

export const createQuickLinkDraft = (
  input: CreateQuickLinkDraftInput
): QuickLinkDraft => {
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
