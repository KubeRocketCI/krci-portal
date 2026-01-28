import z from "zod";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

export const NAMES = {
  EXTERNAL_URL: "externalUrl",
  TOKEN: "token",
  URL: "url",
} as const;

export const manageSonarFormSchema = z.object({
  [NAMES.EXTERNAL_URL]: z
    .string()
    .min(1, "Enter the external SonarQube URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS), "Enter a valid URL with HTTPS protocol."),
  [NAMES.TOKEN]: z.string().min(1, "Enter the API token for SonarQube authentication."),
  [NAMES.URL]: z
    .string()
    .min(1, "Enter the SonarQube URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS), "Enter a valid URL with HTTP/HTTPS protocol."),
});

export type ManageSonarFormValues = z.infer<typeof manageSonarFormSchema>;
