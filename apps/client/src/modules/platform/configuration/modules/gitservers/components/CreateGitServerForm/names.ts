import z from "zod";
import { gitProvider, gitProviderEnum } from "@my-project/shared";
import { NAMES } from "./constants";

export { NAMES } from "./constants";

const baseSchema = z.object({
  [NAMES.GIT_HOST]: z.string().min(1, "Enter the Git server host."),
  [NAMES.GIT_PROVIDER]: z.enum(gitProviderEnum.options, {
    required_error: "Select Git provider.",
    invalid_type_error: "Select Git provider.",
  }),
  [NAMES.GIT_USER]: z.string().min(1, "Enter the Git user."),
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

export const createGitServerFormSchema = baseSchema.superRefine((data, ctx) => {
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

export type CreateGitServerFormValues = z.infer<typeof createGitServerFormSchema>;
