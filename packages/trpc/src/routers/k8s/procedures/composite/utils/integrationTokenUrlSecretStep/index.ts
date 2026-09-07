import { z } from "zod";
import { k8sSecretConfig } from "@my-project/shared";
import type { Secret, SecretDraft } from "@my-project/shared";
import { currentResourceSchema } from "../createManageIntegrationProcedure/index.js";
import type { IntegrationInput, IntegrationStep } from "../createManageIntegrationProcedure/index.js";

/** ArgoCD, DefectDojo, DependencyTrack and SonarQube all authenticate with a token and a URL. */
export const integrationTokenUrlSecretSchema = z.object({
  token: z.string(),
  url: z.string(),
  currentResource: currentResourceSchema,
});

export type IntegrationTokenUrlSecretSlice = z.infer<typeof integrationTokenUrlSecretSchema>;

type TokenUrlSecret = { token: string; url: string };

/** The least an integration input must declare for the shared step to fit it. */
type TokenUrlSecretHost = IntegrationInput & {
  dirtyFields: { secret: boolean };
  secret: IntegrationTokenUrlSecretSlice;
};

/**
 * Builds the secret step for a token-and-URL integration. Only the shared draft and
 * edit helpers vary; the key, the resource config and the forwarded fields do not.
 */
export function integrationTokenUrlSecretStep(helpers: {
  createDraft: (input: TokenUrlSecret) => SecretDraft;
  edit: (existingSecret: Secret, input: TokenUrlSecret) => Secret;
}) {
  return {
    key: "secret",
    resourceConfig: k8sSecretConfig,
    createDraft: (secret: IntegrationTokenUrlSecretSlice) =>
      helpers.createDraft({ token: secret.token, url: secret.url }) as Secret,
    edit: (currentResource: Secret, secret: IntegrationTokenUrlSecretSlice) =>
      helpers.edit(currentResource, { token: secret.token, url: secret.url }),
  } as const satisfies IntegrationStep<TokenUrlSecretHost, "secret", IntegrationTokenUrlSecretSlice, Secret>;
}
