import z, { ZodError } from "zod";
import { GitProvider, gitProvider } from "../../../../groups/KRCI/index.js";
import { k8sSecretConfig, SecretDraft, secretDraftSchema } from "../../../../groups/Core/index.js";
import { k8sResourceNameSchema } from "../../../../common/index.js";
import { SECRET_LABEL_SECRET_TYPE } from "../../../constants.js";
import { safeEncode } from "../../../../../../utils/index.js";

export const gitUser = {
  GERRIT: "edp-ci",
  GITHUB: "git",
  GITLAB: "git",
  BITBUCKET: "git",
};

// The default gerrit server keeps its legacy secret name; every other server
// gets a per-server name so several GitServers of one provider can coexist.
export const createGitServerSecretName = (_gitProvider: GitProvider, gitServerName: string): string => {
  return _gitProvider === gitProvider.gerrit && gitServerName === gitProvider.gerrit
    ? "gerrit-ciuser-sshkey"
    : `ci-${gitServerName}`;
};

const createGitServerSecretDraftSchema = z.discriminatedUnion("gitProvider", [
  z.object({
    gitProvider: z.literal(gitProvider.bitbucket),
    secretName: k8sResourceNameSchema,
    sshPrivateKey: z.string(),
    token: z.string(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.github),
    secretName: k8sResourceNameSchema,
    sshPrivateKey: z.string(),
    token: z.string(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.gitlab),
    secretName: k8sResourceNameSchema,
    sshPrivateKey: z.string(),
    token: z.string(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.gerrit),
    secretName: k8sResourceNameSchema,
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
      name: parsedInput.data.secretName,
    },
    data,
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
