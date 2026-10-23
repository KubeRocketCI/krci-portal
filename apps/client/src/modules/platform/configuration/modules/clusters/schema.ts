import z from "zod";
import { clusterType, clusterTypeEnum } from "@my-project/shared";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

/**
 * Form-level validator of the Add and Edit Cluster forms. It runs on a change of any field,
 * so it also flags required fields that were never touched.
 */
export const clusterSecretFormSchema = z
  .object({
    clusterType: clusterTypeEnum,
    clusterName: z.string().min(1, "Enter a name for the cluster."),
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
