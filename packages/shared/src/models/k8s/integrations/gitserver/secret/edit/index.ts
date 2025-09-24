import { Secret } from "../../../../groups/Core";
import { editResource } from "../../../utils";
import { safeEncode } from "../../../../../../utils";
import z from "zod";
import { Draft } from "immer";
import { gitProvider } from "../../../../groups/KRCI";
import { gitUser } from "../create";

const editGitServerSecretSchema = z.discriminatedUnion("gitProvider", [
  z.object({
    gitProvider: z.literal(gitProvider.bitbucket),
    sshPrivateKey: z.string(),
    token: z.string(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.github),
    sshPrivateKey: z.string(),
    token: z.string(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.gitlab),
    sshPrivateKey: z.string(),
    token: z.string(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.gerrit),
    sshPrivateKey: z.string(),
    sshPublicKey: z.string(),
  }),
]);

export const editGitServerSecret = (
  existingSecret: Secret,
  input: z.infer<typeof editGitServerSecretSchema>
): Secret => {
  return editResource(
    existingSecret,
    input,
    editGitServerSecretSchema,
    (draft: Draft<Secret>, validatedInput) => {
      if (!draft.data) {
        draft.data = {};
      }

      // Clear existing data
      draft.data = {};

      switch (validatedInput.gitProvider) {
        case gitProvider.gerrit:
          draft.data.id_rsa =
            safeEncode(validatedInput.sshPrivateKey.trim() + "\n") || "";
          draft.data["id_rsa.pub"] =
            safeEncode(validatedInput.sshPublicKey) || "";
          draft.data.username = safeEncode(gitUser.GERRIT) || "";
          break;
        case gitProvider.github:
          draft.data.id_rsa =
            safeEncode(validatedInput.sshPrivateKey.trim() + "\n") || "";
          draft.data.token = safeEncode(validatedInput.token) || "";
          draft.data.username = safeEncode(gitUser.GITHUB) || "";
          break;
        case gitProvider.gitlab:
          draft.data.id_rsa =
            safeEncode(validatedInput.sshPrivateKey.trim() + "\n") || "";
          draft.data.token = safeEncode(validatedInput.token) || "";
          break;
        case gitProvider.bitbucket:
          draft.data.id_rsa =
            safeEncode(validatedInput.sshPrivateKey.trim() + "\n") || "";
          draft.data.token = safeEncode(validatedInput.token) || "";
          break;
      }
    }
  );
};
