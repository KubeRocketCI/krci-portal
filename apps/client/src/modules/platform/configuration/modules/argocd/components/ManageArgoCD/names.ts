import z from "zod";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

/**
 * Field names for the unified ArgoCD integration form
 */
export const NAMES = {
  // QuickLink fields
  EXTERNAL_URL: "externalUrl",
  // Secret fields
  TOKEN: "token",
  URL: "url",
} as const;

/**
 * Unified form schema for ArgoCD integration
 * Validates all fields in a single form
 */
export const manageArgoCDFormSchema = z.object({
  [NAMES.EXTERNAL_URL]: z
    .string()
    .min(1, "Enter the Argo CD URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS), "Enter a valid URL with HTTPS protocol."),
  [NAMES.TOKEN]: z.string().min(1, "Enter the authentication token for Argo CD."),
  [NAMES.URL]: z
    .string()
    .min(1, "Enter the Argo CD URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS), "Enter a valid URL with HTTPS protocol."),
});

export type ManageArgoCDFormValues = z.infer<typeof manageArgoCDFormSchema>;
