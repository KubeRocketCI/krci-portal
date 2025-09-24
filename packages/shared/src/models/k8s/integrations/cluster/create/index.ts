import z, { ZodError } from "zod";
import { Secret, SecretDraft, secretDraftSchema } from "../../../groups/Core";
import {
  SECRET_LABEL_CLUSTER_TYPE,
  SECRET_LABEL_SECRET_TYPE,
} from "../../constants";
import { safeDecode, safeEncode, parseConfigJson } from "../../../../../utils";

export const clusterTypeEnum = z.enum(["bearer", "irsa"]);

export const clusterType = clusterTypeEnum.enum;

export type ClusterType = z.infer<typeof clusterTypeEnum>;

const createClusterSecretDraftSchema = z.discriminatedUnion("clusterType", [
  z.object({
    clusterType: z.literal(clusterType.bearer),
    clusterName: z.string(),
    clusterHost: z.string(),
    clusterToken: z.string(),
    clusterCertificate: z.string().optional(),
    skipTLSVerify: z.boolean(),
  }),

  z.object({
    clusterType: z.literal(clusterType.irsa),
    clusterName: z.string(),
    clusterHost: z.string(),
    roleARN: z.string(),
    caData: z.string(),
  }),
]);

type CreateClusterSecretDraftInput = z.infer<
  typeof createClusterSecretDraftSchema
>;

export const createClusterSecretDraft = (
  input: CreateClusterSecretDraftInput
): SecretDraft => {
  const parsedInput = createClusterSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  let draft: SecretDraft;

  const clusterMetadataName = `${input.clusterName}-cluster`;

  if (input.clusterType === clusterType.bearer) {
    draft = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: clusterMetadataName,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "cluster",
          [SECRET_LABEL_CLUSTER_TYPE]: "bearer",
        },
      },
      data: {
        config:
          safeEncode(
            JSON.stringify({
              apiVersion: "v1",
              kind: "Config",
              "current-context": "default-context",
              preferences: {},
              clusters: [
                {
                  cluster: {
                    server: input.clusterHost,
                    ...(input.skipTLSVerify && {
                      "insecure-skip-tls-verify": true,
                    }),
                    ...(input.clusterCertificate &&
                      !input.skipTLSVerify && {
                        "certificate-authority-data": input.clusterCertificate,
                      }),
                  },
                  name: input.clusterName,
                },
              ],
              contexts: [
                {
                  context: {
                    cluster: input.clusterName,
                    user: "default-user",
                  },
                  name: "default-context",
                },
              ],
              users: [
                {
                  user: {
                    token: input.clusterToken,
                  },
                  name: "default-user",
                },
              ],
            })
          ) || "",
      },
    };
  }

  if (input.clusterType === clusterType.irsa) {
    draft = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: clusterMetadataName,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "cluster",
          [SECRET_LABEL_CLUSTER_TYPE]: "irsa",
          "argocd.argoproj.io/secret-type": "cluster",
        },
      },
      data: {
        config:
          safeEncode(
            JSON.stringify({
              server: input.clusterHost,
              awsAuthConfig: {
                clusterName: input.clusterName,
                roleARN: input.roleARN,
              },
              tlsClientConfig: {
                insecure: false,
                caData: input.caData,
              },
            })
          ) || "",
        name: safeEncode(input.clusterName) || "",
        server: safeEncode(input.clusterHost) || "",
      },
    };
  }

  const parsedDraft = secretDraftSchema.safeParse(draft!);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }
  return parsedDraft.data;
};

export const getClusterName = (secret: Secret): string => {
  const _clusterType =
    secret.metadata?.labels?.[SECRET_LABEL_CLUSTER_TYPE] ?? clusterType.bearer;
  const config = parseConfigJson(secret.data?.config || "");

  if (_clusterType === clusterType.bearer) {
    return config?.clusters[0]?.name;
  }

  return safeDecode(secret.data?.name || "") || "";
};
