import { z } from "zod";
import { createDependencyTrackIntegrationSecretDraft, editDependencyTrackIntegrationSecret } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";
import { integrationQuickLinkSchema, integrationQuickLinkStep } from "../utils/integrationQuickLinkStep/index.js";
import {
  integrationTokenUrlSecretSchema,
  integrationTokenUrlSecretStep,
} from "../utils/integrationTokenUrlSecretStep/index.js";

const manageDependencyTrackIntegrationInputSchema = integrationInputBaseSchema.extend({
  dirtyFields: z.object({
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  quickLink: integrationQuickLinkSchema,
  secret: integrationTokenUrlSecretSchema,
});

export type ManageDependencyTrackIntegrationInput = z.infer<typeof manageDependencyTrackIntegrationInputSchema>;

export const k8sManageDependencyTrackIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageDependencyTrackIntegrationInputSchema,
  label: "DependencyTrack integration",
  steps: [
    integrationTokenUrlSecretStep({
      createDraft: createDependencyTrackIntegrationSecretDraft,
      edit: editDependencyTrackIntegrationSecret,
    }),
    integrationQuickLinkStep,
  ],
});
