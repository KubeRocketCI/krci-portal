import { Secret } from "../../../groups/Core";
import { editResource } from "../../utils";
import { safeEncode } from "../../../../../utils";
import z from "zod";
import { Draft } from "immer";
import { clusterType } from "../create";

const editClusterSecretSchema = z.discriminatedUnion("clusterType", [
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

export const editClusterSecret = (existingSecret: Secret, input: z.infer<typeof editClusterSecretSchema>): Secret => {
  return editResource(existingSecret, input, editClusterSecretSchema, (draft: Draft<Secret>, validatedInput) => {
    if (!draft.data) {
      draft.data = {};
    }

    if (validatedInput.clusterType === clusterType.bearer) {
      draft.data.config =
        safeEncode(
          JSON.stringify({
            apiVersion: "v1",
            kind: "Config",
            "current-context": "default-context",
            preferences: {},
            clusters: [
              {
                cluster: {
                  server: validatedInput.clusterHost,
                  ...(validatedInput.skipTLSVerify && {
                    "insecure-skip-tls-verify": true,
                  }),
                  ...(validatedInput.clusterCertificate &&
                    !validatedInput.skipTLSVerify && {
                      "certificate-authority-data": validatedInput.clusterCertificate,
                    }),
                },
                name: validatedInput.clusterName,
              },
            ],
            contexts: [
              {
                context: {
                  cluster: validatedInput.clusterName,
                  user: "default-user",
                },
                name: "default-context",
              },
            ],
            users: [
              {
                user: {
                  token: validatedInput.clusterToken,
                },
                name: "default-user",
              },
            ],
          })
        ) || "";
    }

    if (validatedInput.clusterType === clusterType.irsa) {
      draft.data.config =
        safeEncode(
          JSON.stringify({
            server: validatedInput.clusterHost,
            awsAuthConfig: {
              clusterName: validatedInput.clusterName,
              roleARN: validatedInput.roleARN,
            },
            tlsClientConfig: {
              insecure: false,
              caData: validatedInput.caData,
            },
          })
        ) || "";
      draft.data.name = safeEncode(validatedInput.clusterName) || "";
      draft.data.server = safeEncode(validatedInput.clusterHost) || "";
    }
  });
};
