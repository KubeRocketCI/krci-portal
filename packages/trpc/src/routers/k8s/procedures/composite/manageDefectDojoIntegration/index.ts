import { z } from "zod";
import { createDefectDojoIntegrationSecretDraft, editDefectDojoIntegrationSecret } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";
import { integrationQuickLinkSchema, integrationQuickLinkStep } from "../utils/integrationQuickLinkStep/index.js";
import {
  integrationTokenUrlSecretSchema,
  integrationTokenUrlSecretStep,
} from "../utils/integrationTokenUrlSecretStep/index.js";

const manageDefectDojoIntegrationInputSchema = integrationInputBaseSchema.extend({
  dirtyFields: z.object({
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  quickLink: integrationQuickLinkSchema,
  secret: integrationTokenUrlSecretSchema,
});

export type ManageDefectDojoIntegrationInput = z.infer<typeof manageDefectDojoIntegrationInputSchema>;

export const k8sManageDefectDojoIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageDefectDojoIntegrationInputSchema,
  label: "DefectDojo integration",
  steps: [
    integrationTokenUrlSecretStep({
      createDraft: createDefectDojoIntegrationSecretDraft,
      edit: editDefectDojoIntegrationSecret,
    }),
    integrationQuickLinkStep,
  ],
});
