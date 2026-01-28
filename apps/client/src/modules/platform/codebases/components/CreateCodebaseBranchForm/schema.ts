import z from "zod";
import { validationRules } from "@/core/constants/validation";
import { validateField } from "@/core/utils/forms/validation";
import { NAMES } from "./constants";

const baseSchema = z.object({
  [NAMES.NAME]: z.string().optional(),
  [NAMES.CODEBASE_NAME_LABEL]: z.string().optional(),
  [NAMES.CODEBASE_NAME]: z.string().optional(),

  [NAMES.FROM_TYPE]: z.string().default("branch"),
  [NAMES.FROM_COMMIT]: z.string().default(""),

  [NAMES.RELEASE]: z.boolean(),

  [NAMES.VERSION]: z.string().default(""),
  [NAMES.RELEASE_BRANCH_VERSION_START]: z.string().default(""),
  [NAMES.RELEASE_BRANCH_VERSION_POSTFIX]: z.string().default(""),
  [NAMES.DEFAULT_BRANCH_VERSION_START]: z.string().default(""),
  [NAMES.DEFAULT_BRANCH_VERSION_POSTFIX]: z.string().default(""),

  [NAMES.BUILD_PIPELINE]: z.string().min(1, "Select Build pipeline"),
  [NAMES.REVIEW_PIPELINE]: z.string().min(1, "Select Review pipeline"),
  [NAMES.SECURITY_PIPELINE]: z.string().default(""),

  [NAMES.BRANCH_NAME]: z.string().default(""),
  [NAMES.RELEASE_BRANCH_NAME]: z.string().default(""),
});

export interface CreateCodebaseBranchValidationContext {
  existingBranchNames: string[];
}

export const createCodebaseBranchSchema = (context: CreateCodebaseBranchValidationContext) => {
  return baseSchema.superRefine((data, ctx) => {
    const { existingBranchNames } = context;
    const semverPattern = /^([0-9]+)\.([0-9]+)\.([0-9]+)?$/;

    if (!data.release) {
      if (!data.branchName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.BRANCH_NAME],
          message: "Enter branch name",
        });
      } else {
        if (existingBranchNames.includes(data.branchName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [NAMES.BRANCH_NAME],
            message: `Branch name "${data.branchName}" already exists`,
          });
        }

        if (validationRules.BRANCH_NAME && typeof data.branchName === "string") {
          const validationResult = validateField(data.branchName, validationRules.BRANCH_NAME);
          if (validationResult !== true) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [NAMES.BRANCH_NAME],
              message: validationResult,
            });
          }
        }
      }
    }

    if (data.release) {
      if (!data.releaseBranchName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.RELEASE_BRANCH_NAME],
          message: "Enter release branch name",
        });
      } else if (!/^[a-z0-9][a-z0-9/\-.]*[a-z0-9]$/.test(data.releaseBranchName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.RELEASE_BRANCH_NAME],
          message:
            "Branch name may contain only: lower-case letters, numbers, slashes, dashes and dots. Can start and end only with lower-case letters and numbers. Minimum 2 characters.",
        });
      }

      if (!data.releaseBranchVersionStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.RELEASE_BRANCH_VERSION_START],
          message: "Branch version is required",
        });
      } else if (!semverPattern.test(data.releaseBranchVersionStart)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.RELEASE_BRANCH_VERSION_START],
          message: "Enter valid semantic versioning format",
        });
      }

      if (!data.defaultBranchVersionStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.DEFAULT_BRANCH_VERSION_START],
          message: "Default branch version is required",
        });
      } else if (!semverPattern.test(data.defaultBranchVersionStart)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.DEFAULT_BRANCH_VERSION_START],
          message: "Enter valid semantic versioning format",
        });
      }

      if (!data.defaultBranchVersionPostfix) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.DEFAULT_BRANCH_VERSION_POSTFIX],
          message: "Default branch version is required",
        });
      }
    }

    const fromType = data.fromType || "branch";
    if (data.fromCommit) {
      if (fromType === "commit") {
        if (!/^[a-fA-F0-9]{40}$/.test(data.fromCommit)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [NAMES.FROM_COMMIT],
            message: "Commit hash must be a full Git commit hash (40 hexadecimal characters)",
          });
        }
      } else if (fromType === "branch") {
        if (validationRules.BRANCH_NAME && typeof data.fromCommit === "string") {
          const validationResult = validateField(data.fromCommit, validationRules.BRANCH_NAME);
          if (validationResult !== true) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [NAMES.FROM_COMMIT],
              message: validationResult,
            });
          }
        }
      }
    }
  });
};

export type CreateCodebaseBranchFormValues = z.infer<typeof baseSchema>;
