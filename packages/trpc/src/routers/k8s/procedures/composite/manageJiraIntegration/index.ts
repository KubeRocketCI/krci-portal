import { z } from "zod";
import {
  createJiraIntegrationSecretDraft,
  createJiraServerDraft,
  editJiraIntegrationSecret,
  editJiraServer,
  k8sJiraServerConfig,
  k8sSecretConfig,
} from "@my-project/shared";
import type { JiraServer, Secret } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";
import { integrationQuickLinkSchema, integrationQuickLinkStep } from "../utils/integrationQuickLinkStep/index.js";

const manageJiraIntegrationInputSchema = integrationInputBaseSchema.extend({
  dirtyFields: z.object({
    jiraServer: z.boolean(),
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  jiraServer: z.object({
    url: z.string(),
    currentResource: z.any().optional(),
  }),
  quickLink: integrationQuickLinkSchema,
  secret: z.object({
    username: z.string(),
    password: z.string(),
    currentResource: z.any().optional(),
  }),
});

export type ManageJiraIntegrationInput = z.infer<typeof manageJiraIntegrationInputSchema>;

export const k8sManageJiraIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageJiraIntegrationInputSchema,
  label: "Jira integration",
  steps: [
    {
      key: "secret",
      resourceConfig: k8sSecretConfig,
      createDraft: (secret) =>
        createJiraIntegrationSecretDraft({ username: secret.username, password: secret.password }),
      edit: (currentResource: Secret, secret) =>
        editJiraIntegrationSecret(currentResource, { username: secret.username, password: secret.password }),
    },
    {
      key: "jiraServer",
      resourceConfig: k8sJiraServerConfig,
      createDraft: (jiraServer) => createJiraServerDraft({ url: jiraServer.url }),
      edit: (currentResource: JiraServer, jiraServer) => editJiraServer(currentResource, { url: jiraServer.url }),
    },
    integrationQuickLinkStep,
  ],
});
