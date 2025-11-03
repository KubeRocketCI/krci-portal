import z, { ZodError } from "zod";
import { GitProvider, gitProvider } from "../../../../groups/KRCI";
import { k8sSecretConfig, SecretDraft, secretDraftSchema } from "../../../../groups/Core";
import { SECRET_LABEL_SECRET_TYPE } from "../../../constants";
import { safeEncode } from "../../../../../../utils";

export const gitUser = {
  GERRIT: "edp-ci",
  GITHUB: "git",
  GITLAB: "git",
  BITBUCKET: "git",
};

export const createGitServerSecretName = (_gitProvider: GitProvider): string => {
  return _gitProvider === gitProvider.gerrit ? "gerrit-ciuser-sshkey" : `ci-${_gitProvider}`;
};

const createGitServerSecretDraftSchema = z.discriminatedUnion("gitProvider", [
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

export const createGitServerSecretDraft = (input: z.infer<typeof createGitServerSecretDraftSchema>): SecretDraft => {
  const parsedInput = createGitServerSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  let data: Record<string, string> = {};

  switch (parsedInput.data.gitProvider) {
    case gitProvider.gerrit:
      data.id_rsa = safeEncode(parsedInput.data.sshPrivateKey.trim() + "\n") || "";
      data["id_rsa.pub"] = safeEncode(parsedInput.data.sshPublicKey) || "";
      data.username = safeEncode(gitUser.GERRIT) || "";
      break;
    case gitProvider.github:
      data.id_rsa = safeEncode(parsedInput.data.sshPrivateKey.trim() + "\n") || "";
      data.token = safeEncode(parsedInput.data.token) || "";
      data.username = safeEncode(gitUser.GITHUB) || "";
      break;
    case gitProvider.gitlab:
      data.id_rsa = safeEncode(parsedInput.data.sshPrivateKey.trim() + "\n") || "";
      data.token = safeEncode(parsedInput.data.token) || "";
      break;
    case gitProvider.bitbucket:
      data.id_rsa = safeEncode(parsedInput.data.sshPrivateKey.trim() + "\n") || "";
      data.token = safeEncode(parsedInput.data.token) || "";
      break;
  }

  const draft: SecretDraft = {
    apiVersion: k8sSecretConfig.apiVersion,
    kind: k8sSecretConfig.kind,
    metadata: {
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "repository",
      },
      name: createGitServerSecretName(parsedInput.data.gitProvider),
    },
    data,
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
