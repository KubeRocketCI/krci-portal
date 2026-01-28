import z from "zod";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

export const NAMES = {
  EXTERNAL_URL: "externalUrl",
  API_URL: "apiUrl",
  TOKEN: "token",
  ASSISTANT_ID: "assistantId",
} as const;

export const manageChatAssistantFormSchema = z.object({
  [NAMES.EXTERNAL_URL]: z
    .string()
    .min(1, "Enter the external Chat Assistant URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS), "Enter a valid URL with HTTPS protocol."),
  [NAMES.API_URL]: z
    .string()
    .min(1, "Enter Chat Assistant API URL.")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS), "Enter a valid URL with HTTP/HTTPS protocol."),
  [NAMES.TOKEN]: z.string().min(1, "Enter token"),
  [NAMES.ASSISTANT_ID]: z.string().min(1, "Enter Assistant ID."),
});

export type ManageChatAssistantFormValues = z.infer<typeof manageChatAssistantFormSchema>;
