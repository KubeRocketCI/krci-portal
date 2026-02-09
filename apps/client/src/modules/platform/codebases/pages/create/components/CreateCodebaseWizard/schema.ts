import {
  codebaseCreationStrategy,
  codebaseType,
  createCodebaseDraftInputSchema,
  gitProvider,
} from "@my-project/shared";
import z from "zod";
import { validationRules } from "@/core/constants/validation";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const isEmptyStr = (val: string | null | undefined): boolean => {
  return !val || val.trim().length === 0;
};

const isApplication = (type: string | null | undefined): boolean => type === codebaseType.application;

const isAutotest = (type: string | null | undefined): boolean => type === codebaseType.autotest;

const isCloneStrategy = (strategy: string | null | undefined): boolean => strategy === codebaseCreationStrategy.clone;

const isGerrit = (gitServer: string | null | undefined): boolean => gitServer === gitProvider.gerrit;

// ============================================================================
// EXTENDED SCHEMAS (from single source of truth)
// ============================================================================

const repositoryUrlSchema = createCodebaseDraftInputSchema.shape.repositoryUrl.refine(
  (val) => {
    if (!val) return true;
    return /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)[\w.@/~-]+\w/.test(val);
  },
  { message: "Specify the application URL in the following format: http(s)://git.example.com/example." }
);

const nameSchema = createCodebaseDraftInputSchema.shape.name
  .min(2, "Project name must be not less than two characters long.")
  .max(30, "Project name must be less than 30 characters long.")
  .regex(/^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/, {
    message:
      "Project name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces",
  });

const defaultBranchSchema = createCodebaseDraftInputSchema.shape.defaultBranch
  .min(1, "Specify a branch to work in.")
  .regex(/^[a-z0-9][a-z0-9/\-.]*[a-z0-9]$/, { message: "Enter valid default branch name" });

const buildToolSchema = createCodebaseDraftInputSchema.shape.buildTool.min(1, "Select or enter build tool");

const frameworkSchema = createCodebaseDraftInputSchema.shape.framework.min(
  1,
  "Select or enter language version/framework"
);

const langSchema = createCodebaseDraftInputSchema.shape.lang.min(1, "Select codebase language");

// ============================================================================
// UI-ONLY FIELDS
// ============================================================================

const uiOnlyFields = {
  ui_creationMethod: z.string().nullable().optional(),
  ui_creationTemplate: z.string().nullable().optional(),
  ui_repositoryOwner: z.string().optional(),
  ui_repositoryName: z.string().optional(),
  ui_hasCodebaseAuth: z.boolean(),
  ui_repositoryLogin: z.string().optional(),
  ui_repositoryPasswordOrApiToken: z.string().optional(),
  ui_hasJiraServerIntegration: z.boolean(),
  ui_versioningStartFromVersion: z.string().nullable().optional(),
  ui_versioningStartFromSnapshot: z.string().nullable().optional(),
  ui_advancedMappingFieldName: z.array(z.string()).optional().default([]),
  ui_advancedMappingJiraPattern: z.string().optional(),
  ui_advancedMappingRows: z
    .array(z.object({ field: z.string(), pattern: z.string().min(1, "Add at least one variable.") }))
    .optional()
    .default([]),
};

// ============================================================================
// CORE FIELDS
// ============================================================================

const coreFields = {
  name: nameSchema,
  defaultBranch: defaultBranchSchema,
  buildTool: buildToolSchema,
  framework: frameworkSchema,
  lang: langSchema,
  repositoryUrl: repositoryUrlSchema,
  gitServer: createCodebaseDraftInputSchema.shape.gitServer,
  gitUrlPath: createCodebaseDraftInputSchema.shape.gitUrlPath.optional().nullable(),
  type: createCodebaseDraftInputSchema.shape.type,
  deploymentScript: createCodebaseDraftInputSchema.shape.deploymentScript,
  description: createCodebaseDraftInputSchema.shape.description,
  emptyProject: createCodebaseDraftInputSchema.shape.emptyProject,
  private: createCodebaseDraftInputSchema.shape.private,
  strategy: createCodebaseDraftInputSchema.shape.strategy,
  testReportFramework: createCodebaseDraftInputSchema.shape.testReportFramework,
  versioningType: createCodebaseDraftInputSchema.shape.versioningType,
  versioningStartFrom: createCodebaseDraftInputSchema.shape.versioningStartFrom,
  ciTool: createCodebaseDraftInputSchema.shape.ciTool,
  commitMessagePattern: createCodebaseDraftInputSchema.shape.commitMessagePattern,
  jiraServer: createCodebaseDraftInputSchema.shape.jiraServer,
  ticketNamePattern: createCodebaseDraftInputSchema.shape.ticketNamePattern,
  jiraIssueMetadataPayload: createCodebaseDraftInputSchema.shape.jiraIssueMetadataPayload,
  branchToCopyInDefaultBranch: createCodebaseDraftInputSchema.shape.branchToCopyInDefaultBranch,
  disablePutDeployTemplates: createCodebaseDraftInputSchema.shape.disablePutDeployTemplates,
};

export const baseCommonFields = {
  ...coreFields,
  ...uiOnlyFields,
};

// ============================================================================
// STRATEGY-SPECIFIC SCHEMAS
// ============================================================================

const cloneStrategySchema = z.object({
  ...baseCommonFields,
  strategy: z.literal(codebaseCreationStrategy.clone),
  repositoryUrl: repositoryUrlSchema,
});

const createStrategySchema = z.object({
  ...baseCommonFields,
  strategy: z.literal(codebaseCreationStrategy.create),
  repositoryUrl: createCodebaseDraftInputSchema.shape.repositoryUrl.nullable().optional(),
});

const importStrategySchema = z.object({
  ...baseCommonFields,
  strategy: z.literal(codebaseCreationStrategy.import),
  repositoryUrl: createCodebaseDraftInputSchema.shape.repositoryUrl.nullable().optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const tempDiscriminatedSchema = z.discriminatedUnion("strategy", [
  cloneStrategySchema,
  createStrategySchema,
  importStrategySchema,
]);
type FormData = z.infer<typeof tempDiscriminatedSchema>;

const validateMethodStep = (data: FormData, ctx: z.RefinementCtx) => {
  if (!data.ui_creationMethod) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ui_creationMethod"], message: "Select creation method" });
  }
  if (data.ui_creationMethod === "template" && !data.ui_creationTemplate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ui_creationTemplate"], message: "Select a template" });
  }
  if (data.ui_creationMethod === "custom" && !data.type) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["type"], message: "Select codebase type" });
  }
};

const validateGerritGitUrlPath = (data: FormData, ctx: z.RefinementCtx) => {
  if (isEmptyStr(data.gitUrlPath) || (data.gitUrlPath && data.gitUrlPath.length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gitUrlPath"],
      message: "Repository name has to be at least 3 characters long.",
    });
  } else if (data.gitUrlPath && !validationRules.GIT_URL_PATH.every((rule) => rule.pattern.test(data.gitUrlPath!))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gitUrlPath"], message: "Invalid git URL path format" });
  }
};

const validateNonGerritRepository = (data: FormData, ctx: z.RefinementCtx) => {
  if (isEmptyStr(data.ui_repositoryOwner)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ui_repositoryOwner"], message: "Select owner" });
  }
  if (isEmptyStr(data.ui_repositoryName)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ui_repositoryName"], message: "Enter the repository name" });
  } else if (data.ui_repositoryName && data.ui_repositoryName.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_repositoryName"],
      message: "Repository name must be at least 3 characters long",
    });
  } else if (
    data.ui_repositoryName &&
    !validationRules.REPOSITORY_NAME.every((rule) => rule.pattern.test(data.ui_repositoryName!))
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_repositoryName"],
      message: "Invalid repository name format",
    });
  }
};

const validateRepositoryAuth = (data: FormData, ctx: z.RefinementCtx) => {
  if (isEmptyStr(data.ui_repositoryLogin)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ui_repositoryLogin"], message: "Enter repository login" });
  } else if (data.ui_repositoryLogin && !/\w/.test(data.ui_repositoryLogin)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_repositoryLogin"],
      message: "Enter valid repository login",
    });
  }
  if (isEmptyStr(data.ui_repositoryPasswordOrApiToken)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_repositoryPasswordOrApiToken"],
      message: "Enter the repository password or access token",
    });
  } else if (data.ui_repositoryPasswordOrApiToken && !/\w/.test(data.ui_repositoryPasswordOrApiToken)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_repositoryPasswordOrApiToken"],
      message: "Enter valid repository password or api token",
    });
  }
};

const validateGitSetupStep = (data: FormData, ctx: z.RefinementCtx) => {
  if (!data.gitServer) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gitServer"], message: "Select an existing Git server" });
  }
  if (isGerrit(data.gitServer)) {
    validateGerritGitUrlPath(data, ctx);
  } else {
    validateNonGerritRepository(data, ctx);
  }
  if (!data.description) {
    const typeLabel = data.type || "project";
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["description"],
      message: `Enter ${typeLabel} description`,
    });
  }
  if (data.ui_hasCodebaseAuth && isCloneStrategy(data.strategy)) {
    validateRepositoryAuth(data, ctx);
  }
};

const validateBuildConfigStep = (data: FormData, ctx: z.RefinementCtx) => {
  if (isAutotest(data.type) && !data.testReportFramework) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["testReportFramework"],
      message: "Select autotest report framework",
    });
  }
  if (isApplication(data.type) && !data.deploymentScript) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deploymentScript"],
      message: "Select the deployment script",
    });
  }

  // Validate Jira integration fields if enabled
  if (data.ui_hasJiraServerIntegration) {
    if (!data.jiraServer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jiraServer"],
        message: "Select Jira server that will be integrated with the codebase.",
      });
    }
    if (!data.ticketNamePattern) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ticketNamePattern"],
        message: "Specify the pattern to find a Jira ticket number in a commit message.",
      });
    }
  }
};

// ============================================================================
// MAIN FORM SCHEMA
// ============================================================================

export const createCodebaseFormSchema = tempDiscriminatedSchema.superRefine((data, ctx) => {
  validateMethodStep(data, ctx);
  validateGitSetupStep(data, ctx);
  validateBuildConfigStep(data, ctx);
});

export const createCodebaseSubmitSchema = createCodebaseFormSchema.transform((data) => ({
  ...data,
  name: typeof data.name === "string" ? data.name.trim() : data.name,
}));

export type CreateCodebaseFormValues = z.infer<typeof createCodebaseFormSchema>;
