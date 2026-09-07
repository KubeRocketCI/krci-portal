import { z } from "zod";
import { createNexusIntegrationSecretDraft, editNexusIntegrationSecret, k8sSecretConfig } from "@my-project/shared";
import type { Secret } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";
import { integrationQuickLinkSchema, integrationQuickLinkStep } from "../utils/integrationQuickLinkStep/index.js";

const manageNexusIntegrationInputSchema = integrationInputBaseSchema.extend({
  dirtyFields: z.object({
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  quickLink: integrationQuickLinkSchema,
  secret: z.object({
    username: z.string(),
    password: z.string(),
    url: z.string(),
    currentResource: z.any().optional(),
  }),
});

export type ManageNexusIntegrationInput = z.infer<typeof manageNexusIntegrationInputSchema>;

export const k8sManageNexusIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageNexusIntegrationInputSchema,
  label: "Nexus integration",
  steps: [
    {
      key: "secret",
      resourceConfig: k8sSecretConfig,
      createDraft: (secret) =>
        createNexusIntegrationSecretDraft({
          username: secret.username,
          password: secret.password,
          url: secret.url,
        }),
      edit: (currentResource: Secret, secret) =>
        editNexusIntegrationSecret(currentResource, {
          username: secret.username,
          password: secret.password,
          url: secret.url,
        }),
    },
    integrationQuickLinkStep,
  ],
});
