import z from "zod";
import { validationRules } from "@/core/constants/validation";
import { validateField } from "@/core/utils/forms/validation";
import { NAMES } from "./names";

// ============================================================================
// BASE SCHEMA
// ============================================================================

const baseSchema = z.object({
  // Metadata fields - optional internal fields
  [NAMES.NAME]: z.string().optional(),
  [NAMES.CODEBASE_NAME_LABEL]: z.string().optional(),
  [NAMES.CODEBASE_NAME]: z.string().optional(),

  // Form type selector - default value makes it required string in output
  [NAMES.FROM_TYPE]: z.string().default("branch"),

  // Commit/branch source - default makes it required string
  [NAMES.FROM_COMMIT]: z.string().default(""),

  // Release flag
  [NAMES.RELEASE]: z.boolean(),

  // Version fields - defaults make them required strings
  [NAMES.VERSION]: z.string().default(""),
  [NAMES.RELEASE_BRANCH_VERSION_START]: z.string().default(""),
  [NAMES.RELEASE_BRANCH_VERSION_POSTFIX]: z.string().default(""),
  [NAMES.DEFAULT_BRANCH_VERSION_START]: z.string().default(""),
  [NAMES.DEFAULT_BRANCH_VERSION_POSTFIX]: z.string().default(""),

  // Required pipeline fields
  [NAMES.BUILD_PIPELINE]: z.string().min(1, "Select Build pipeline"),
  [NAMES.REVIEW_PIPELINE]: z.string().min(1, "Select Review pipeline"),
  [NAMES.SECURITY_PIPELINE]: z.string().default(""),

  // Branch name fields - defaults make them required strings
  [NAMES.BRANCH_NAME]: z.string().default(""),
  [NAMES.RELEASE_BRANCH_NAME]: z.string().default(""),
});

// ============================================================================
// VALIDATION CONTEXT TYPE
// ============================================================================

export interface ManageCodebaseBranchValidationContext {
  existingBranchNames: string[];
}

// ============================================================================
// SCHEMA FACTORY WITH DYNAMIC VALIDATION
// ============================================================================

export const createManageCodebaseBranchSchema = (context: ManageCodebaseBranchValidationContext) => {
  return baseSchema.superRefine((data, ctx) => {
    const { existingBranchNames } = context;
    const semverPattern = /^([0-9]+)\.([0-9]+)\.([0-9]+)?$/;

    // Branch Name validation (for non-release branches)
    if (!data.release) {
      if (!data.branchName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.BRANCH_NAME],
          message: "Enter branch name",
        });
      } else {
        // Check if branch already exists
        if (existingBranchNames.includes(data.branchName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [NAMES.BRANCH_NAME],
            message: `Branch name "${data.branchName}" already exists`,
          });
        }

        // Validate branch name format
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

    // Release Branch validation (for release branches)
    if (data.release) {
      // Release branch name
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

      // Release branch version (start)
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

      // Default branch version (start)
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

      // Default branch version (postfix)
      if (!data.defaultBranchVersionPostfix) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [NAMES.DEFAULT_BRANCH_VERSION_POSTFIX],
          message: "Default branch version is required",
        });
      }
    }

    // From Commit validation (conditional based on fromType)
    const fromType = data.fromType || "branch";
    if (data.fromCommit) {
      if (fromType === "commit") {
        // Validate commit hash format
        if (!/^[a-fA-F0-9]{40}$/.test(data.fromCommit)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [NAMES.FROM_COMMIT],
            message: "Commit hash must be a full Git commit hash (40 hexadecimal characters)",
          });
        }
      } else if (fromType === "branch") {
        // Validate branch name format
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

// ============================================================================
// EDIT SCHEMA (pipelines only)
// ============================================================================

export const editCodebaseBranchFormSchema = z.object({
  [NAMES.BUILD_PIPELINE]: z.string().min(1, "Select Build pipeline"),
  [NAMES.REVIEW_PIPELINE]: z.string().min(1, "Select Review pipeline"),
  [NAMES.SECURITY_PIPELINE]: z.string().default(""),
});

export type EditCodebaseBranchFormValues = z.infer<typeof editCodebaseBranchFormSchema>;

// Export the schema type factory
export type ManageCodebaseBranchFormSchema = ReturnType<typeof createManageCodebaseBranchSchema>;

// Export the inferred form values type from the base schema
export type ManageCodebaseBranchFormValues = z.infer<typeof baseSchema>;
