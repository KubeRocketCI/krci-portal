import { z } from "zod";
import {
  createChatAssistantIntegrationSecretDraft,
  editChatAssistantIntegrationSecret,
  k8sSecretConfig,
} from "@my-project/shared";
import type { Secret } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  currentResourceSchema,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";
import { integrationQuickLinkSchema, integrationQuickLinkStep } from "../utils/integrationQuickLinkStep/index.js";

const manageChatAssistantIntegrationInputSchema = integrationInputBaseSchema.extend({
  dirtyFields: z.object({
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  quickLink: integrationQuickLinkSchema,
  secret: z.object({
    apiUrl: z.string(),
    token: z.string(),
    assistantId: z.string(),
    currentResource: currentResourceSchema,
  }),
});

export type ManageChatAssistantIntegrationInput = z.infer<typeof manageChatAssistantIntegrationInputSchema>;

export const k8sManageChatAssistantIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageChatAssistantIntegrationInputSchema,
  label: "Chat Assistant integration",
  steps: [
    {
      key: "secret",
      resourceConfig: k8sSecretConfig,
      createDraft: (secret) =>
        createChatAssistantIntegrationSecretDraft({
          apiUrl: secret.apiUrl,
          token: secret.token,
          assistantId: secret.assistantId,
        }),
      edit: (currentResource: Secret, secret) =>
        editChatAssistantIntegrationSecret(currentResource, {
          apiUrl: secret.apiUrl,
          token: secret.token,
          assistantId: secret.assistantId,
        }),
    },
    integrationQuickLinkStep,
  ],
});
