import { z } from "zod";
import { createArgoCDIntegrationSecretDraft, editArgoCDIntegrationSecret } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";
import { integrationQuickLinkSchema, integrationQuickLinkStep } from "../utils/integrationQuickLinkStep/index.js";
import {
  integrationTokenUrlSecretSchema,
  integrationTokenUrlSecretStep,
} from "../utils/integrationTokenUrlSecretStep/index.js";

const manageArgoCDIntegrationInputSchema = integrationInputBaseSchema.extend({
  dirtyFields: z.object({
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  quickLink: integrationQuickLinkSchema,
  secret: integrationTokenUrlSecretSchema,
});

export type ManageArgoCDIntegrationInput = z.infer<typeof manageArgoCDIntegrationInputSchema>;

export const k8sManageArgoCDIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageArgoCDIntegrationInputSchema,
  label: "ArgoCD integration",
  steps: [
    integrationTokenUrlSecretStep({
      createDraft: createArgoCDIntegrationSecretDraft,
      edit: editArgoCDIntegrationSecret,
    }),
    integrationQuickLinkStep,
  ],
});
