import z from "zod";
import {
  CLUSTER_SECRET_NAME_SUFFIX,
  clusterType,
  clusterTypeEnum,
  K8S_RESOURCE_NAME_MAX_LENGTH,
  k8sResourceNamePattern,
} from "@my-project/shared";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

// Secret name: `<clusterName>-cluster`, a DNS subdomain.
const MAX_CLUSTER_NAME_LENGTH = K8S_RESOURCE_NAME_MAX_LENGTH - CLUSTER_SECRET_NAME_SUFFIX.length;

const createClusterName = z
  .string()
  .min(1, "Enter a name for the cluster.")
  .max(MAX_CLUSTER_NAME_LENGTH, `Use at most ${MAX_CLUSTER_NAME_LENGTH} characters.`)
  .regex(k8sResourceNamePattern, "Use lowercase letters, numbers, '-' and '.'. Start and end with a letter or number.");

// Edit: the name is read-only; legacy names are accepted.
const editClusterName = z.string().min(1, "Enter a name for the cluster.");

/**
 * Form-level validator of the Add and Edit Cluster forms. It runs on a change of any field,
 * so it also flags required fields that were never touched.
 */
const buildClusterSecretFormSchema = (clusterName: z.ZodString) =>
  z
    .object({
      clusterType: clusterTypeEnum,
      clusterName,
      clusterHost: z
        .string()
        .min(1, "Enter the cluster URL assigned to the host.")
        .regex(getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS), "Enter a valid URL with HTTPS protocol."),
      clusterToken: z.string(),
      clusterCertificate: z.string(),
      skipTLSVerify: z.boolean(),
      roleARN: z.string(),
      caData: z.string(),
    })
    .superRefine((values, ctx) => {
      const requireValue = (field: "clusterToken" | "clusterCertificate" | "caData" | "roleARN", message: string) => {
        if (!values[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message,
          });
        }
      };

      if (values.clusterType === clusterType.bearer) {
        requireValue("clusterToken", "Provide the cluster token.");

        // createClusterSecretDraft accepts a missing certificate and writes a kubeconfig with neither
        // certificate-authority-data nor insecure-skip-tls-verify; a cluster behind a private CA then fails
        // every connection with "unknown authority".
        if (!values.skipTLSVerify) {
          requireValue("clusterCertificate", "Paste the cluster certificate.");
        }

        return;
      }

      requireValue("caData", "Enter Certificate Authority Data.");
      requireValue("roleARN", "Enter Role ARN.");
    });

export const clusterSecretFormSchema = buildClusterSecretFormSchema(createClusterName);
export const editClusterSecretFormSchema = buildClusterSecretFormSchema(editClusterName);
