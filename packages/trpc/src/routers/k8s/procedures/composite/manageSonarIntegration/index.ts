import { z } from "zod";
import { createSonarQubeIntegrationSecretDraft, editSonarQubeIntegrationSecret } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";
import { integrationQuickLinkSchema, integrationQuickLinkStep } from "../utils/integrationQuickLinkStep/index.js";
import {
  integrationTokenUrlSecretSchema,
  integrationTokenUrlSecretStep,
} from "../utils/integrationTokenUrlSecretStep/index.js";

const manageSonarIntegrationInputSchema = integrationInputBaseSchema.extend({
  dirtyFields: z.object({
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  quickLink: integrationQuickLinkSchema,
  secret: integrationTokenUrlSecretSchema,
});

export type ManageSonarIntegrationInput = z.infer<typeof manageSonarIntegrationInputSchema>;

export const k8sManageSonarIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageSonarIntegrationInputSchema,
  label: "SonarQube integration",
  steps: [
    integrationTokenUrlSecretStep({
      createDraft: createSonarQubeIntegrationSecretDraft,
      edit: editSonarQubeIntegrationSecret,
    }),
    integrationQuickLinkStep,
  ],
});
