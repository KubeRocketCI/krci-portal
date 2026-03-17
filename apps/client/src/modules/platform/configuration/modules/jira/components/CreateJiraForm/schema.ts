import z from "zod";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { NAMES } from "./constants";

export const createJiraFormSchema = z.object({
  [NAMES.URL]: z
    .string()
    .min(1, "Enter Jira URL (e.g., https://your-jira-instance.com).")
    .regex(getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS), "Enter a valid URL with HTTPS protocol."),
  [NAMES.USERNAME]: z.string().min(1, "Enter your Jira username."),
  [NAMES.PASSWORD]: z.string().min(1, "Enter your Jira password."),
});

export type CreateJiraFormValues = z.infer<typeof createJiraFormSchema>;
