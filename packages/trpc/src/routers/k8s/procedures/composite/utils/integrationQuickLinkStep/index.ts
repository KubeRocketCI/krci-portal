import { z } from "zod";
import { editQuickLinkURL, httpsUrlSchema, k8sQuickLinkConfig } from "@my-project/shared";
import type { QuickLink } from "@my-project/shared";
import { currentResourceSchema } from "../createManageIntegrationProcedure/index.js";
import type { IntegrationInput, IntegrationStep } from "../createManageIntegrationProcedure/index.js";

/** The QuickLink slice is identical across integrations; `externalUrl` is https-only. */
export const integrationQuickLinkSchema = z
  .object({
    name: z.string(),
    externalUrl: httpsUrlSchema,
    currentResource: currentResourceSchema,
  })
  .optional();

export type IntegrationQuickLinkSlice = NonNullable<z.infer<typeof integrationQuickLinkSchema>>;

/** The least an integration input must declare for the shared step to fit it. */
type QuickLinkHost = IntegrationInput & {
  dirtyFields: { quickLink: boolean };
  quickLink?: IntegrationQuickLinkSlice;
};

/**
 * The platform provisions the QuickLink with the namespace, so there is no create path.
 * A create request carries `externalUrl` but does not write it; only edit rewrites the URL.
 */
export const integrationQuickLinkStep = {
  key: "quickLink",
  skipInCreateMode: true,
  resourceConfig: k8sQuickLinkConfig,
  edit: (currentResource: QuickLink, slice: IntegrationQuickLinkSlice) =>
    editQuickLinkURL(currentResource, { url: slice.externalUrl }),
} as const satisfies IntegrationStep<QuickLinkHost, "quickLink", IntegrationQuickLinkSlice, QuickLink>;
