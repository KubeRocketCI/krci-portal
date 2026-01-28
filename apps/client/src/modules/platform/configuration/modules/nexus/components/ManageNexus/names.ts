import z from "zod";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

export const NAMES = {
  EXTERNAL_URL: "externalUrl",
  USERNAME: "username",
  PASSWORD: "password",
  URL: "url",
} as const;

export const manageNexusFormSchema = z.object({
  [NAMES.EXTERNAL_URL]: z
    .string()
    .min(1, "Enter the external Nexus URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS), "Enter a valid URL with HTTPS protocol."),
  [NAMES.USERNAME]: z.string().min(1, "Enter your Nexus username."),
  [NAMES.PASSWORD]: z.string().min(1, "Provide the password associated with your Nexus repository username."),
  [NAMES.URL]: z
    .string()
    .min(1, "Enter the Nexus repository URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS), "Enter a valid URL with HTTP/HTTPS protocol."),
});

export type ManageNexusFormValues = z.infer<typeof manageNexusFormSchema>;
