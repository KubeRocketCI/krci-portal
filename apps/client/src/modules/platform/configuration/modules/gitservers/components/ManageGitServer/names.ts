import z from "zod";
import { gitProviderEnum } from "@my-project/shared";
import { NAMES } from "./constants";

const nameRequirementRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export { NAMES } from "./constants";

const baseSchema = z.object({
  [NAMES.NAME]: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .regex(
      nameRequirementRegex,
      "Name must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash."
    ),
  [NAMES.GIT_HOST]: z.string().min(1, "Enter the Git server host."),
  [NAMES.GIT_PROVIDER]: gitProviderEnum,
  [NAMES.GIT_USER]: z.string().min(1, "Enter the Git user."),
  [NAMES.NAME_SSH_KEY_SECRET]: z.string().min(1, "Enter the SSH key secret name."),
  [NAMES.SSH_PORT]: z.coerce.number().int().min(1).max(65535),
  [NAMES.HTTPS_PORT]: z.coerce.number().int().min(1).max(65535),
  [NAMES.SKIP_WEBHOOK_SSL]: z.boolean(),
  [NAMES.TEKTON_DISABLED]: z.boolean(),
  [NAMES.OVERRIDE_WEBHOOK_URL]: z.boolean(),
  [NAMES.WEBHOOK_URL]: z.string().optional(),
  [NAMES.SSH_PRIVATE_KEY]: z.string().min(1, "Paste your private SSH key for authentication."),
  [NAMES.SSH_PUBLIC_KEY]: z.string().optional(),
  [NAMES.TOKEN]: z.string().optional(),
});

export const manageGitServerFormSchema = baseSchema.superRefine((data, ctx) => {
  if (data[NAMES.GIT_PROVIDER] === "gerrit") {
    if (!(data[NAMES.SSH_PUBLIC_KEY] ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Paste your public SSH key for Gerrit.",
        path: [NAMES.SSH_PUBLIC_KEY],
      });
    }
  } else {
    if (!(data[NAMES.TOKEN] ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the token for authentication.",
        path: [NAMES.TOKEN],
      });
    }
  }
});

export type ManageGitServerFormValues = z.infer<typeof manageGitServerFormSchema>;
