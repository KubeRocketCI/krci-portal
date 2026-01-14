import {
  codebaseCreationStrategy,
  codebaseType,
  createCodebaseDraftInputSchema,
  gitProvider,
} from "@my-project/shared";
import z from "zod";
import { validationRules } from "@/core/constants/validation";
import { ValueOf } from "@/core/types/global";

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

// Extend base schemas with additional validation messages
const repositoryUrlSchema = createCodebaseDraftInputSchema.shape.repositoryUrl.refine(
  (val) => {
    if (!val) {
      return true;
    }
    return /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)[\w.@/~-]+\w/.test(val);
  },
  {
    message: "Specify the application URL in the following format: http(s)://git.example.com/example.",
  }
);

const nameSchema = createCodebaseDraftInputSchema.shape.name
  .min(2, "Component name must be not less than two characters long.")
  .max(30, "Component name must be less than 30 characters long.")
  .regex(/^[a-z](?!.*--[^-])[a-z0-9-]*[a-z0-9]$/, {
    message:
      "Component name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces",
  });

const defaultBranchSchema = createCodebaseDraftInputSchema.shape.defaultBranch
  .min(1, "Specify a branch to work in.")
  .regex(/^[a-z0-9][a-z0-9/\-.]*[a-z0-9]$/, {
    message: "Enter valid default branch name",
  });

const buildToolSchema = createCodebaseDraftInputSchema.shape.buildTool.min(1, "Select or enter build tool");

const frameworkSchema = createCodebaseDraftInputSchema.shape.framework.min(
  1,
  "Select or enter language version/framework"
);

const langSchema = createCodebaseDraftInputSchema.shape.lang.min(1, "Select codebase language");

// ============================================================================
// UI-ONLY FIELDS (New schemas for UI state management)
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
  ui_hasCodemieIntegration: z.boolean(),
  ui_versioningStartFromVersion: z.string().nullable().optional(),
  ui_versioningStartFromSnapshot: z.string().nullable().optional(),
  ui_advancedMappingFieldName: z.array(z.string()).optional().default([]),
  ui_advancedMappingJiraPattern: z.string().optional(),
  ui_advancedMappingRows: z
    .array(
      z.object({
        field: z.string(),
        pattern: z.string().min(1, "Add at least one variable."),
      })
    )
    .optional()
    .default([]),
};

// ============================================================================
// CORE FIELDS (From original schema + extended versions)
// ============================================================================

const coreFields = {
  // Extended schemas with additional validation
  name: nameSchema,
  defaultBranch: defaultBranchSchema,
  buildTool: buildToolSchema,
  framework: frameworkSchema,
  lang: langSchema,
  repositoryUrl: repositoryUrlSchema,

  // Direct from original schema
  gitServer: createCodebaseDraftInputSchema.shape.gitServer,
  gitUrlPath: createCodebaseDraftInputSchema.shape.gitUrlPath,
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

const baseCommonFields = {
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
// VALIDATION HELPERS (Organized by Step)
// ============================================================================

// Create temporary schema to infer type for validation functions
const tempDiscriminatedSchema = z.discriminatedUnion("strategy", [
  cloneStrategySchema,
  createStrategySchema,
  importStrategySchema,
]);
type FormData = z.infer<typeof tempDiscriminatedSchema>;

/**
 * Step 1: METHOD validation
 */
const validateMethodStep = (data: FormData, ctx: z.RefinementCtx) => {
  if (!data.ui_creationMethod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_creationMethod"],
      message: "Select creation method",
    });
  }

  if (data.ui_creationMethod === "template" && !data.ui_creationTemplate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_creationTemplate"],
      message: "Select a template",
    });
  }

  if (data.ui_creationMethod === "custom" && !data.type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type"],
      message: "Select codebase type",
    });
  }
};

/**
 * Step 2 Helpers: Gerrit-specific validation
 */
const validateGerritGitUrlPath = (data: FormData, ctx: z.RefinementCtx) => {
  if (isEmptyStr(data.gitUrlPath) || (data.gitUrlPath && data.gitUrlPath.length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gitUrlPath"],
      message: "Repository name has to be at least 3 characters long.",
    });
  } else if (data.gitUrlPath && !validationRules.GIT_URL_PATH.every((rule) => rule.pattern.test(data.gitUrlPath))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gitUrlPath"],
      message: "Invalid git URL path format",
    });
  }
};

/**
 * Step 2 Helpers: Non-Gerrit repository validation
 */
const validateNonGerritRepository = (data: FormData, ctx: z.RefinementCtx) => {
  if (isEmptyStr(data.ui_repositoryOwner)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_repositoryOwner"],
      message: "Select owner",
    });
  }

  if (isEmptyStr(data.ui_repositoryName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_repositoryName"],
      message: "Enter the repository name",
    });
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

/**
 * Step 2 Helpers: Repository authentication validation
 */
const validateRepositoryAuth = (data: FormData, ctx: z.RefinementCtx) => {
  if (isEmptyStr(data.ui_repositoryLogin)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ui_repositoryLogin"],
      message: "Enter repository login",
    });
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

/**
 * Step 2: GIT_SETUP validation
 */
const validateGitSetupStep = (data: FormData, ctx: z.RefinementCtx) => {
  // Git Server validation
  if (!data.gitServer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gitServer"],
      message: "Select an existing Git server",
    });
  }

  // Git URL configuration (Gerrit vs Others)
  if (isGerrit(data.gitServer)) {
    validateGerritGitUrlPath(data, ctx);
  } else {
    validateNonGerritRepository(data, ctx);
  }

  // Description validation
  if (!data.description) {
    const typeLabel = data.type || "component";
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["description"],
      message: `Enter ${typeLabel} description`,
    });
  }

  // Repository authentication (only for clone strategy)
  if (data.ui_hasCodebaseAuth && isCloneStrategy(data.strategy)) {
    validateRepositoryAuth(data, ctx);
  }
};

/**
 * Step 3: BUILD_CONFIG validation
 */
const validateBuildConfigStep = (data: FormData, ctx: z.RefinementCtx) => {
  // Autotest-specific validation
  if (isAutotest(data.type) && !data.testReportFramework) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["testReportFramework"],
      message: "Select autotest report framework",
    });
  }

  // Application-specific validation
  if (isApplication(data.type) && !data.deploymentScript) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deploymentScript"],
      message: "Select the deployment script",
    });
  }
};

// ============================================================================
// MAIN FORM SCHEMA
// ============================================================================

export const createCodebaseFormSchema = tempDiscriminatedSchema
  .superRefine((data, ctx) => {
    // Run all validations independently to prevent cascading issues
    validateMethodStep(data, ctx);
    validateGitSetupStep(data, ctx);
    validateBuildConfigStep(data, ctx);
  })
  .transform((data) => {
    return {
      ...data,
      name: typeof data.name === "string" ? data.name.trim() : data.name,
    };
  });

// ============================================================================
// FORM PARTS CONFIGURATION
// ============================================================================

function createNamesObject<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: K } {
  const result = {} as { [K in keyof T]: K };
  for (const key in obj) {
    result[key] = key;
  }
  return result;
}

const baseSchemaForNames = z.object(baseCommonFields);
export const NAMES = createNamesObject(baseSchemaForNames.shape);

export type CreateCodebaseFormValues = z.infer<typeof createCodebaseFormSchema>;

export const FORM_PARTS = {
  METHOD: "method",
  GIT_SETUP: "gitSetup",
  BUILD_CONFIG: "buildConfig",
} as const;

export type CreationMethod = "template" | "custom";
export type FormPart = ValueOf<typeof FORM_PARTS>;

export const CREATE_FORM_PARTS = {
  [FORM_PARTS.METHOD]: [NAMES.ui_creationMethod, NAMES.ui_creationTemplate, NAMES.type, NAMES.strategy],
  [FORM_PARTS.GIT_SETUP]: [
    NAMES.repositoryUrl,
    NAMES.gitServer,
    NAMES.gitUrlPath,
    NAMES.ui_repositoryOwner,
    NAMES.ui_repositoryName,
    NAMES.defaultBranch,
    NAMES.name,
    NAMES.description,
    NAMES.private,
    NAMES.ui_hasCodebaseAuth,
    NAMES.ui_repositoryLogin,
    NAMES.ui_repositoryPasswordOrApiToken,
  ],
  [FORM_PARTS.BUILD_CONFIG]: [
    NAMES.lang,
    NAMES.framework,
    NAMES.buildTool,
    NAMES.testReportFramework,
    NAMES.deploymentScript,
    NAMES.versioningType,
    NAMES.versioningStartFrom,
    NAMES.ui_versioningStartFromVersion,
    NAMES.ui_versioningStartFromSnapshot,
    NAMES.ciTool,
    NAMES.commitMessagePattern,
    NAMES.ui_hasJiraServerIntegration,
    NAMES.jiraServer,
    NAMES.ticketNamePattern,
    NAMES.ui_advancedMappingFieldName,
    NAMES.ui_advancedMappingJiraPattern,
    NAMES.ui_advancedMappingRows,
    NAMES.jiraIssueMetadataPayload,
    NAMES.emptyProject,
    NAMES.ui_hasCodemieIntegration,
  ],
} as const;
