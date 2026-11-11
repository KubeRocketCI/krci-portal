import z from "zod";
import { gitProvider, gitProviderEnum } from "@my-project/shared";
import { NAMES } from "./constants";

export { NAMES } from "./constants";

const baseSchema = z.object({
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

export const editGitServerFormSchema = baseSchema.superRefine((data, ctx) => {
  if (data[NAMES.GIT_PROVIDER] === gitProvider.gerrit) {
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

export type EditGitServerFormValues = z.infer<typeof editGitServerFormSchema>;
