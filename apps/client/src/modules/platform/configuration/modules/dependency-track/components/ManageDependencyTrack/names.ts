import z from "zod";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

/**
 * Field names for the unified DependencyTrack integration form
 */
export const NAMES = {
  EXTERNAL_URL: "externalUrl",
  TOKEN: "token",
  URL: "url",
} as const;

/**
 * Unified form schema for DependencyTrack integration
 */
export const manageDependencyTrackFormSchema = z.object({
  [NAMES.EXTERNAL_URL]: z
    .string()
    .min(1, "Enter the external Dependency Track URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS), "Enter a valid URL with HTTPS protocol."),
  [NAMES.TOKEN]: z.string().min(1, "Enter the API token for Dependency Track authentication."),
  [NAMES.URL]: z
    .string()
    .min(1, "Enter the Dependency Track URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS), "Enter a valid URL with HTTP/HTTPS protocol."),
});

export type ManageDependencyTrackFormValues = z.infer<typeof manageDependencyTrackFormSchema>;
